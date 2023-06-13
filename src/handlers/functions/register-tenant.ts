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

  const item = JSON.parse(event.body) as RegisterTenantRequest
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
        message: `Tenant details already exists ${{tenantAlreadyExists}}, ${{
          tenantAdminUserAlreadyExists,
        }}, ${{tenantARecordAlreadyExists}}`,
      },
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }

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

  await publishCreateTenantAdminAndUserGroupEvent({
    password,
    emailAddress: item.emailAddress,
    tenantName: item.name,
    firstName: item.firstName,
    lastName: item.lastName,
    addressLineOne,
    addressLineTwo,
    postCode,
    doorNumber,
    townCity,
  })

  await createTenantARecord({tenantName: item.name, hostedZoneId, stage, route53Client})

  await publishTenantRegisteredLogEvent({
    emailAddress: item.emailAddress,
    name: item.name,
    firstName: item.firstName,
    lastName: item.lastName,
    addressLineOne,
    addressLineTwo,
    postCode,
    doorNumber,
    townCity,
    tier: item.tier,
  })

  return {
    body: {
      message: 'Tenant created successfully!',
      result: item,
    },
    statusCode: HttpStatusCode.CREATED,
  }
}
