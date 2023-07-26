import {DynamoDB} from 'aws-sdk'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {CreateGymAppRequest, HttpStatusCode, MembaApp} from '../../types'
import {validateCreateGymAppRequest} from '../../validators'
import {createARecord, deleteARecord, getARecord} from '../../aws/route53'
import CONFIG from '../../config'
import {createUserGroup} from '../../aws/cognito'
import {appendItemToList} from '../../aws/dynamodb/append-item-to-list'
import {v4 as uuidv4} from 'uuid'
import {deleteUserGroup} from '../../aws/cognito/delete-user-group'

interface CreateGymAppProps {
  hostedZoneId: string
  stage: string
  dbClient: DynamoDB.DocumentClient
  event: APIGatewayProxyEvent
}

export const createGymApp = async (props: CreateGymAppProps) => {
  const {event, hostedZoneId, stage, dbClient} = props

  const tableName = process.env.TABLE_NAME ?? ''
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

  const tenantARecordAlreadyExists = await getARecord({
    aRecord: item.gymName,
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

  const parsedGymName = item.gymName.replace(' ', '').toLowerCase()
  const url = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME
  const gymUrl = `${parsedGymName}.${url}`

  try {
    await createARecord({
      aRecord: gymUrl,
      hostedZoneUrl: url,
      hostedZoneId,
    })

    await createUserGroup({
      userGroupRoleArn,
      groupName: item.gymName,
      userPoolId,
    })

    const newApp: MembaApp = {
      name: item.gymName,
      memberships: item.memberships,
      id: uuidv4(),
      url: `https://${gymUrl}`,
      tier: item.tier,
      type: 'gym-management',
    }

    const updatedTenant = await appendItemToList({
      itemId: item.tenantId,
      itemToAppend: newApp,
      itemNameToUpdate: 'apps',
      tableName,
      dbClient,
    })

    return {
      body: {
        message: 'App created successfully!',
        result: updatedTenant,
      },
      statusCode: HttpStatusCode.CREATED,
    }
  } catch (error) {
    console.log('CREATE GYM APP ERROR', error)

    await deleteARecord({aRecord: gymUrl, hostedZoneUrl: url, hostedZoneId})

    await deleteUserGroup({
      groupName: item.gymName,
      userPoolId,
    })

    return {
      body: {
        message: 'App failed to create.',
        result: null,
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }
}
