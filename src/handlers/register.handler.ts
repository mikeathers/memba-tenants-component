import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {HttpStatusCode, TenantDetails} from '../types'
import {addCorsHeader, errorHasMessage} from '../utils'
import {createTenantARecord} from './functions/create-tenant-arecord'

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
        if (event.body) {
          const tenantDetails = JSON.parse(event.body) as TenantDetails
          const response = await createTenantARecord({
            tenantName: tenantDetails.tenantName,
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
