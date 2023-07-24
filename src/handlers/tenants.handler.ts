import {DynamoDB} from 'aws-sdk'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'

import {HttpStatusCode} from '../types'
import {addCorsHeader, errorHasMessage} from '../utils'
import {registerTenant} from './functions/register-tenant'
import {createTenant} from './functions/create-tenant'
import {getAccountById} from './functions/get-account-by-id'

const dbClient = new DynamoDB.DocumentClient()

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('request:', JSON.stringify(event, null, 2))

  const result: APIGatewayProxyResult = {
    statusCode: HttpStatusCode.OK,
    body: '',
    headers: addCorsHeader(),
  }

  try {
    switch (event.httpMethod) {
      case 'POST': {
        if (event.path.includes('register-tenant') && event.body) {
          const response = await registerTenant({
            event,
            dbClient,
            hostedZoneId: process.env.HOSTED_ZONE_ID ?? '',
            stage: process.env.STAGE ?? '',
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('create-tenant') && event.body) {
          const response = await createTenant({
            event,
            dbClient,
            stage: process.env.STAGE ?? '',
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        }
        break
      }
      case 'GET': {
        if (event.pathParameters?.id) {
          const response = await getAccountById({id: event.pathParameters.id, dbClient})
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
