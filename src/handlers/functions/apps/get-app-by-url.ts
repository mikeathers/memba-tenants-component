import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, QueryResult} from '../../../types'
import {getByPrimaryKey} from '../../../aws/dynamodb'

interface GetAppByUrlProps {
  url: string
  dbClient: DynamoDB.DocumentClient
}
export const getAppByUrl = async (props: GetAppByUrlProps): Promise<QueryResult> => {
  const {url, dbClient} = props
  const tableName = process.env.TENANTS_TABLE_NAME ?? ''
  const queryKey = 'url'
  const queryValue = url

  console.log({queryKey, queryValue})

  const queryResponse = await getByPrimaryKey({
    queryKey,
    queryValue,
    tableName,
    dbClient,
  })

  console.log('GET BY ID RESPONSE', queryResponse)

  if (queryResponse) {
    return {
      body: {
        message: 'App has been found.',
        result: queryResponse,
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
