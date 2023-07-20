import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {CreateTenantRequest, HttpStatusCode, RegisterTenantRequest} from '../../types'
import {
  validateCreateTenantRequest,
  validateRegisterTenantRequest,
} from '../../validators'
import {queryBySecondaryKey} from '../../aws/dynamodb'
import {publishTenantRegisteredLogEvent} from '../../events/publishers/tenant-registered.publisher'
import {createTenantInDb} from './create-tenant-in-db'
import {checkIfTenantAdminExists} from './check-if-tenant-admin-exists'
import CONFIG from '../../config'
import {createTenantAdminUserAndUserGroup} from './create-tenant-admin-user-and-user-group'
import {createARecord, getARecord} from '../../aws/route53'
import {deleteTenant} from './delete-tenant'
import {rollbackCreateTenant} from './rollback-create-tenant'

interface CreateTenantProps {
  stage: string
  dbClient: DynamoDB.DocumentClient
  event: APIGatewayProxyEvent
}

export const createTenant = async (props: CreateTenantProps) => {
  const {event, stage, dbClient} = props

  const tableName = process.env.TABLE_NAME ?? ''

  if (!event.body) {
    return {
      body: {
        message: 'The event is missing a body and cannot be parsed.',
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }

  const item = JSON.parse(event.body) as CreateTenantRequest
  item.id = uuidv4()

  validateCreateTenantRequest(item)

  try {
    await createTenantInDb({dbClient, item, tableName})

    await publishTenantRegisteredLogEvent(item)

    return {
      body: {
        message: 'Tenant created successfully!',
        item,
      },
      statusCode: HttpStatusCode.CREATED,
    }
  } catch (error) {
    console.log('REGISTER TENANT ERROR: ', error)

    await rollbackCreateTenant({
      id: item.id,
      tableName,
      dbClient,
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
