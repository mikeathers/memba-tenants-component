import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {HttpStatusCode, RegisterTenantRequest} from '../../types'
import {validateRegisterTenantRequest} from '../../validators'
import {queryBySecondaryKey} from '../../aws/dynamodb'
import {publishTenantRegisteredLogEvent} from '../../events/publishers/tenant-registered.publisher'
import {createTenantInDb} from './create-tenant-in-db'
import {checkIfTenantAdminExists} from './check-if-tenant-admin-exists'
import CONFIG from '../../config'
import {createTenantAdminUserAndUserGroup} from './create-tenant-admin-user-and-user-group'
import {createARecord, getARecord} from '../../aws/route53'
import {deleteTenant} from './delete-tenant'

interface RegisterTenantProps {
  hostedZoneId: string
  stage: string
  dbClient: DynamoDB.DocumentClient
  event: APIGatewayProxyEvent
}

export const registerTenant = async (props: RegisterTenantProps) => {
  const {event, hostedZoneId, stage, dbClient} = props

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
    queryValue: item.tenantName,
    tableName,
    dbClient,
  })

  const tenantARecordAlreadyExists = await getARecord({
    tenantUrl: item.tenantName,
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

  const parsedTenantName = item.tenantName.replace(' ', '').toLowerCase()
  const url = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME
  const tenantUrl = `${parsedTenantName}.${url}`

  item.tenantUrl = tenantUrl
  item.tenantName = parsedTenantName

  const {
    password,
    addressLineTwo,
    addressLineOne,
    postCode,
    doorNumber,
    townCity,
    ...rest
  } = item

  try {
    await createTenantInDb({dbClient, item: {...rest}, tableName})

    await createARecord({
      tenantUrl,
      hostedZoneUrl: url,
      hostedZoneId,
    })

    await createTenantAdminUserAndUserGroup({
      usersApiUrl,
      usersApiSecretName,
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
      tenantId: item.id,
    })

    await publishTenantRegisteredLogEvent({
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
      tenantId: item.id,
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
      tenantId: item.id,
    }

    return {
      body: {
        message: 'Tenant created successfully!',
        result,
      },
      statusCode: HttpStatusCode.CREATED,
    }
  } catch (error) {
    console.log('REGISTER TENANT ERROR: ', error)

    await deleteTenant({
      tenantUrl,
      hostedZoneUrl: url,
      hostedZoneId,
      tableName,
      dbClient,
      tenantId: item.id,
    })

    return {
      body: {
        message: 'Tenant failed to create.',
        result: null,
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }
}
