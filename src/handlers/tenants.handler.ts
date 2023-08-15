import {DynamoDB} from 'aws-sdk'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'

import {HttpStatusCode} from '../types'
import {addCorsHeader, errorHasMessage} from '../utils'
import {createTenant} from './functions/create-tenant'
import {getTenantById} from './functions/get-tenant-by-id'
import {createGymApp} from './functions/create-gym-app'
import {getAppByUrl} from './functions/apps/get-app-by-url'
import {addUserToApp} from './functions/add-user-to-app'
import {checkIfUserHasAccessToApp, getBasicApp} from './functions/apps'

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const isTenantAdmin = event.requestContext.authorizer?.claims[
      'custom:isTenantAdmin'
    ] as boolean

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const isMembaAdmin = event.requestContext.authorizer?.claims[
      'custom:isMembaAdmin'
    ] as boolean

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const tenantIdFromClaims = event.requestContext.authorizer?.claims[
      'custom:tenantId'
    ] as string

    const isAdmin = isTenantAdmin || isMembaAdmin

    switch (event.httpMethod) {
      case 'POST': {
        if (event.path.includes('create-gym-app') && event.body) {
          const response = await createGymApp({
            event,
            hostedZoneId,
            stage,
            dbClient,
            isAdmin,
            tenantIdFromClaims,
          })
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
        if (
          event.path.includes('has-access') &&
          event.queryStringParameters?.emailAddress &&
          event.queryStringParameters?.url
        ) {
          const response = await checkIfUserHasAccessToApp({
            dbClient,
            url: event.queryStringParameters?.url,
            emailAddress: event.queryStringParameters?.emailAddress,
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('get-basic-app') && event.pathParameters?.url) {
          const response = await getBasicApp({dbClient, url: event.pathParameters.url})
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('get-app') && event.pathParameters?.url) {
          const response = await getAppByUrl({
            url: event.pathParameters.url,
            dbClient,
            isAdmin,
            tenantIdFromClaims,
          })
          result.body = JSON.stringify(response.body)
          result.statusCode = response.statusCode
        } else if (event.path.includes('get-tenant') && event.pathParameters?.id) {
          const response = await getTenantById({
            id: event.pathParameters.id,
            dbClient,
            isAdmin,
            tenantIdFromClaims,
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
