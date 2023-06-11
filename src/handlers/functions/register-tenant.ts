import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {HttpStatusCode, RegisterTenantRequest} from '../../types'
import {validateRegisterTenantRequest} from '../../validators/tenant.validator'
import {queryBySecondaryKey} from '../../aws/dynamodb'
import {createCertificate} from '../../aws/certificate'
import {createTenantARecord} from './create-tenant-arecord'
import {publishTenantRegisteredEvent} from '../../events/publishers/tenant-registered.publisher'
import {publishCreateTenantAdminAndUserGroupEvent} from '../../events/publishers/create-tenant-admin-and-user-group.publisher'
import {createTenantInDb} from './create-tenant-in-db'

interface RegisterTenantProps {
  hostedZoneId: string
  stage: string
  dbClient: DynamoDB.DocumentClient
  authenticatedUserId: string
  event: APIGatewayProxyEvent
}

export const registerTenant = async (props: RegisterTenantProps) => {
  const {event, hostedZoneId, stage, authenticatedUserId, dbClient} = props

  const tableName = process.env.TABLE_NAME ?? ''

  if (event.body) {
    const item = JSON.parse(event.body) as RegisterTenantRequest
    item.id = uuidv4()
    validateRegisterTenantRequest(item)

    const tenantAlreadyExists = await queryBySecondaryKey({
      queryKey: 'name',
      queryValue: item.name,
      tableName,
      dbClient,
    })

    if (tenantAlreadyExists && tenantAlreadyExists.length < 1) {
      await createTenantInDb({dbClient, item, tableName})

      await createTenantARecord({tenantName: item.name, hostedZoneId, stage})

      await publishCreateTenantAdminAndUserGroupEvent({tenantName: item.name})

      await publishTenantRegisteredEvent(item)

      return {
        body: {
          message: 'Tenant created successfully!',
          result: item,
        },
        statusCode: HttpStatusCode.CREATED,
      }
    } else {
      return {
        body: {
          message: 'Tenant name in use',
        },
        statusCode: HttpStatusCode.BAD_REQUEST,
      }
    }
  }
  return {
    body: {
      message: 'The event is missing a body and cannot be parsed.',
    },
    statusCode: HttpStatusCode.INTERNAL_SERVER,
  }
}
