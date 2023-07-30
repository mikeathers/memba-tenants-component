import {DynamoDB} from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {CreateTenantRequest, HttpStatusCode} from '../../types'
import {validateCreateTenantRequest} from '../../validators'

import {publishTenantRegisteredLogEvent} from '../../events/publishers/tenant-registered.publisher'
import {createTenantInDb} from './create-tenant-in-db'

import {rollbackCreateTenant} from './rollback-create-tenant'

interface CreateTenantProps {
  stage: string
  dbClient: DynamoDB.DocumentClient
  event: APIGatewayProxyEvent
}

export const createTenant = async (props: CreateTenantProps) => {
  const {event, stage, dbClient} = props

  const tableName = process.env.TENANTS_TABLE_NAME ?? ''

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
  item.apps = []

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
