import {DynamoDB} from 'aws-sdk'
import {appendItemToList} from '../../aws/dynamodb'
import {APIGatewayProxyEvent} from 'aws-lambda'
import {AddUserToAppRequest, CreateGymAppRequest, HttpStatusCode} from '../../types'

interface AddUserToApp {
  dbClient: DynamoDB.DocumentClient
  event: APIGatewayProxyEvent
}

export const addUserToApp = async (props: AddUserToApp) => {
  const {dbClient, event} = props
  const tableName = process.env.APPS_TABLE_NAME || ''

  if (!event.body) {
    return {
      body: 'The event is missing a body and cannot be parsed.',
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }

  const item = JSON.parse(event.body) as AddUserToAppRequest

  await appendItemToList({
    itemId: item.appId,
    itemToAppend: item.user,
    itemNameToUpdate: 'users',
    tableName: tableName,
    dbClient,
  })

  return {
    body: 'The user has been added to the app successfully',
    statusCode: HttpStatusCode.OK,
  }
}
