import {DynamoDB} from 'aws-sdk'
import {Route53Client} from '@aws-sdk/client-route-53'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'

import {HttpStatusCode} from '../types'
import {addCorsHeader, errorHasMessage} from '../utils'
import {registerTenant} from './functions/register-tenant'
import CONFIG from '../config'

const dbClient = new DynamoDB.DocumentClient()
const route53Client = new Route53Client({region: CONFIG.REGION})

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('request:', JSON.stringify(event, null, 2))

  const result: APIGatewayProxyResult = {
    statusCode: HttpStatusCode.OK,
    body: '',
  }

  addCorsHeader(event)

  try {
    switch (event.httpMethod) {
      case 'POST': {
        if (event.path.includes('register-tenant') && event.body) {
          const response = await registerTenant({
            event,
            dbClient,
            route53Client,
            hostedZoneId: process.env.HOSTED_ZONE_ID ?? '',
            stage: process.env.STAGE ?? '',
          })
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
