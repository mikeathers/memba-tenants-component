import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, MembaApp, QueryResult} from '../../../types'
import {queryBySecondaryKey} from '../../../aws/dynamodb'

interface GetBasicAppProps {
  dbClient: DynamoDB.DocumentClient
  url: string
}
export const getBasicApp = async (props: GetBasicAppProps): Promise<QueryResult> => {
  const {url, dbClient} = props
  const tableName = process.env.APPS_TABLE_NAME ?? ''
  const queryKey = 'url'
  const queryValue = url

  console.log({queryKey, queryValue})

  const queryResponse = await queryBySecondaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  console.log('GET BY URL RESPONSE', queryResponse)

  if (queryResponse && queryResponse.length > 0) {
    const result = queryResponse[0] as unknown as MembaApp
    const basicApp = {
      id: result.id,
      url: result.url,
      type: result.type,
      name: result.name,
    }
    return {
      body: basicApp,
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: `App with URL: ${url} does not exist.`,
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
