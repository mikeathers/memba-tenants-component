import {DynamoDB} from 'aws-sdk'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {CreateGymAppRequest, HttpStatusCode, MembaApp, Tenant} from '../../types'
import {validateCreateGymAppRequest} from '../../validators'
import {createARecord, deleteARecord, getARecord} from '../../aws/route53'
import CONFIG from '../../config'
import {createUserGroup} from '../../aws/cognito'
import {v4 as uuidv4} from 'uuid'
import {deleteUserGroup} from '../../aws/cognito/delete-user-group'
import {publishGymAppLogEvent} from '../../events/publishers/create-gym-app.publisher'
import {createAppInDb} from './apps'
import {
  removeItemFromList,
  appendItemToList,
  getByPrimaryKey,
  removeItem,
} from '../../aws/dynamodb'

interface CreateGymAppProps {
  hostedZoneId: string
  stage: string
  dbClient: DynamoDB.DocumentClient
  event: APIGatewayProxyEvent
}

export const createGymApp = async (props: CreateGymAppProps) => {
  const {event, hostedZoneId, stage, dbClient} = props

  const tenantsTableName = process.env.TENANTS_TABLE_NAME ?? ''
  const appsTableName = process.env.APPS_TABLE_NAME ?? ''
  const userGroupRoleArn = process.env.USERS_GROUP_ROLE_ARN ?? ''
  const userPoolId = process.env.USER_POOL_ID ?? ''

  if (!event.body) {
    return {
      body: {
        message: 'The event is missing a body and cannot be parsed.',
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }

  const item = JSON.parse(event.body) as CreateGymAppRequest

  validateCreateGymAppRequest(item)

  const parsedGymName = item.gymName
    .replace(/[^a-zA-Z ]/g, '')
    .replace(' ', '')
    .toLowerCase()

  const tenantARecordAlreadyExists = await getARecord({
    aRecord: parsedGymName,
    hostedZoneId,
  })

  if (tenantARecordAlreadyExists) {
    return {
      body: {
        message: `Gym name already exists`,
      },
      statusCode: HttpStatusCode.BAD_REQUEST,
    }
  }

  const url = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME
  const gymUrl = `${parsedGymName}.${url}`

  const newApp: MembaApp = {
    name: item.gymName,
    memberships: item.memberships,
    id: uuidv4(),
    url: `https://${gymUrl}`,
    tier: item.tier,
    type: 'gym-management',
    tenantId: item.tenantId,
  }

  try {
    await createARecord({
      aRecord: gymUrl,
      hostedZoneUrl: url,
      hostedZoneId,
    })

    await createUserGroup({
      userGroupRoleArn,
      groupName: parsedGymName,
      userPoolId,
    })

    const updatedTenant = await appendItemToList({
      itemId: item.tenantId,
      itemToAppend: newApp,
      itemNameToUpdate: 'apps',
      tableName: tenantsTableName,
      dbClient,
    })

    await createAppInDb({dbClient, tableName: appsTableName, item: newApp})

    await publishGymAppLogEvent(item, 'Create')

    return {
      body: {
        message: 'App created successfully!',
        result: updatedTenant.Attributes,
      },
      statusCode: HttpStatusCode.CREATED,
    }
  } catch (error) {
    console.log('CREATE GYM APP ERROR', error)

    await deleteARecord({aRecord: gymUrl, hostedZoneUrl: url, hostedZoneId})

    await deleteUserGroup({
      groupName: parsedGymName,
      userPoolId,
    })

    const tenant = await getByPrimaryKey({
      dbClient,
      tableName: tenantsTableName,
      queryKey: 'id',
      queryValue: item.tenantId,
    })
    await removeItemFromList({
      dbClient,
      listName: 'apps',
      itemToRemove: newApp,
      tableName: tenantsTableName,
      itemId: item.tenantId,
      list: (tenant as Tenant).apps,
    })
    await removeItem({dbClient, tableName: appsTableName, id: newApp.id})

    return {
      body: {
        message: 'App failed to create.',
        result: null,
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }
}
