import {DynamoDB} from 'aws-sdk'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'

import {HttpStatusCode} from '../types'
import {addCorsHeader, errorHasMessage} from '../utils'
import {createTenant} from './functions/create-tenant'
import {getTenantById} from './functions/get-tenant-by-id'
import {createGymApp} from './functions/create-gym-app'
import {getAppByUrl} from './functions/apps/get-app-by-url'
import {addUserToApp} from './functions/add-user-to-app'
import {getBasicApp} from './functions/apps'

const dbClient = new DynamoDB.DocumentClient()

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('request:', JSON.stringify(event, null, 2))
  const hostedZoneId = process.env.HOSTED_ZONE_ID ?? ''
  const stage = process.env.STAGE ?? ''

  const result: APIGatewayProxyResult = {
    statusCode: HttpStatusCode.OK,
    body: '',
    headers: addCorsHeader(),
  }

  try {
    switch (event.httpMethod) {
      case 'POST': {
        if (event.path.includes('create-gym-app') && event.body) {
          const response = await createGymApp({event, hostedZoneId, stage, dbClient})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('create-tenant') && event.body) {
          const response = await createTenant({
            event,
            dbClient,
            stage,
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('add-user-to-app') && event.body) {
          const response = await addUserToApp({dbClient, event})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        }
        break
      }
      case 'GET': {
        if (event.path.includes('get-basic-app') && event.pathParameters?.url) {
          const response = await getBasicApp({dbClient, url: event.pathParameters.url})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('get-app') && event.pathParameters?.url) {
          const response = await getAppByUrl({url: event.pathParameters.url, dbClient})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('get-tenant') && event.pathParameters?.id) {
          const response = await getTenantById({id: event.pathParameters.id, dbClient})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        }
        break
      }
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`)
    }
  } catch (err) {
    console.log('ERROR', err)
    result.statusCode = 500

    if (errorHasMessage(err)) result.body = err.message
    else result.body = 'Something went very wrong.'
  }

  return result
}

export {handler}
