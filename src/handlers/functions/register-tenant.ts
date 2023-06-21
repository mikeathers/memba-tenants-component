import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {HttpStatusCode, RegisterTenantRequest} from '../../types'
import {validateRegisterTenantRequest} from '../../validators/tenant.validator'
import {queryBySecondaryKey} from '../../aws/dynamodb'
import {createTenantARecord} from './create-tenant-arecord'
import {publishTenantRegisteredLogEvent} from '../../events/publishers/tenant-registered.publisher'
import {publishCreateTenantAdminAndUserGroupEvent} from '../../events/publishers/create-tenant-admin-and-user-group.publisher'
import {createTenantInDb} from './create-tenant-in-db'
import {Route53Client} from '@aws-sdk/client-route-53'
import {getTenantARecord} from './get-tenant-a-record'
import {checkIfTenantAdminExists} from './check-if-tenant-admin-exists'
import CONFIG from '../../config'

interface RegisterTenantProps {
  hostedZoneId: string
  stage: string
  dbClient: DynamoDB.DocumentClient
  route53Client: Route53Client
  event: APIGatewayProxyEvent
}

export const registerTenant = async (props: RegisterTenantProps) => {
  const {event, hostedZoneId, stage, dbClient, route53Client} = props

  const tableName = process.env.TABLE_NAME ?? ''
  const usersApiUrl = process.env.USERS_API_URL ?? ''
  const usersApiSecretName = process.env.USERS_API_SECRET_NAME ?? ''

  if (!event.body) {
    return {
      body: {
        message: 'The event is missing a body and cannot be parsed.',
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }

  const item = JSON.parse(event.body) as RegisterTenantRequest & {tenantUrl: string}
  item.id = uuidv4()

  validateRegisterTenantRequest(item)

  const tenantAlreadyExists = await queryBySecondaryKey({
    queryKey: 'name',
    queryValue: item.name,
    tableName,
    dbClient,
  })

  const tenantARecordAlreadyExists = await getTenantARecord({
    route53Client,
    tenantName: item.name,
    hostedZoneId,
  })

  const tenantAdminUserAlreadyExists = await checkIfTenantAdminExists({
    emailToCheck: item.emailAddress,
    usersApiUrl,
    usersApiSecretName,
  })

  if (
    (tenantAlreadyExists && tenantAlreadyExists.length > 0) ||
    tenantARecordAlreadyExists ||
    tenantAdminUserAlreadyExists
  ) {
    return {
      body: {
        message: `Tenant details already exists`,
      },
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }

  const parsedTenantName = item.name.replace(' ', '').toLowerCase()
  const url = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME
  const tenantUrl = `${parsedTenantName}.${url}`

  item.tenantUrl = tenantUrl

  const {
    password,
    addressLineTwo,
    addressLineOne,
    postCode,
    doorNumber,
    townCity,
    ...rest
  } = item

  await createTenantInDb({dbClient, item: {...rest}, tableName})

  await createTenantARecord({
    tenantUrl,
    hostedZoneUrl: url,
    hostedZoneId,
    route53Client,
  })

  await publishCreateTenantAdminAndUserGroupEvent({
    password,
    emailAddress: item.emailAddress,
    tenantName: parsedTenantName,
    firstName: item.firstName,
    lastName: item.lastName,
    addressLineOne,
    addressLineTwo,
    postCode,
    doorNumber,
    townCity,
    tenantUrl,
  })

  await publishTenantRegisteredLogEvent({
    emailAddress: item.emailAddress,
    name: parsedTenantName,
    firstName: item.firstName,
    lastName: item.lastName,
    addressLineOne,
    addressLineTwo,
    postCode,
    doorNumber,
    townCity,
    tier: item.tier,
    tenantUrl,
  })

  const result = {
    emailAddress: item.emailAddress,
    tenantName: parsedTenantName,
    firstName: item.firstName,
    lastName: item.lastName,
    addressLineOne,
    addressLineTwo,
    postCode,
    doorNumber,
    townCity,
    tier: item.tier,
    tenantUrl,
    id: item.id,
  }

  return {
    body: {
      message: 'Tenant created successfully!',
      result,
    },
    statusCode: HttpStatusCode.CREATED,
  }
}
