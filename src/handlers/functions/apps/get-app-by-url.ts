import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, MembaApp, QueryResult} from '../../../types'
import {queryBySecondaryKey} from '../../../aws/dynamodb'

interface GetAppByUrlProps {
  url: string
  dbClient: DynamoDB.DocumentClient
  isAdmin: boolean
  tenantIdFromClaims: string
}
export const getAppByUrl = async (props: GetAppByUrlProps): Promise<QueryResult> => {
  const {url, isAdmin, tenantIdFromClaims, dbClient} = props
  const tableName = process.env.APPS_TABLE_NAME ?? ''
  const queryKey = 'url'
  const queryValue = `https://${url}`

  console.log({queryKey, queryValue})

  if (!isAdmin) {
    return {
      body: 'Unauthorized',
      statusCode: HttpStatusCode.FORBIDDEN,
    }
  }

  const queryResponse = await queryBySecondaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  console.log('GET BY URL RESPONSE', queryResponse)

  if (queryResponse && queryResponse.length > 0) {
    const result = queryResponse[0] as unknown as MembaApp

    if (result.tenantId !== tenantIdFromClaims) {
      return {
        body: 'Unauthorized',
        statusCode: HttpStatusCode.FORBIDDEN,
      }
    }

    return {
      body: result,
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: `App with URL: ${url} does not exist.`,
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
