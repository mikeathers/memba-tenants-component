import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, QueryResult} from '../../../types'
import {queryBySecondaryKey} from '../../../aws/dynamodb'

interface GetAppByUrlProps {
  url: string
  dbClient: DynamoDB.DocumentClient
}
export const getAppByUrl = async (props: GetAppByUrlProps): Promise<QueryResult> => {
  const {url, dbClient} = props
  const tableName = process.env.APPS_TABLE_NAME ?? ''
  const queryKey = 'url'
  const queryValue = `https://${url}`

  console.log({queryKey, queryValue})

  const queryResponse = await queryBySecondaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  console.log('GET BY URL RESPONSE', queryResponse)

  if (queryResponse && queryResponse.length > 0) {
    return {
      body: {
        message: 'App has been found.',
        result: queryResponse[0],
      },
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: {
      message: `App with URL: ${url} does not exist.`,
    },
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
