import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, MembaApp, QueryResult} from '../../../types'
import {queryBySecondaryKey} from '../../../aws/dynamodb'

interface CheckIfUserHasAccessToAppProps {
  url: string
  dbClient: DynamoDB.DocumentClient
  emailAddress: string
}
export const checkIfUserHasAccessToApp = async (
  props: CheckIfUserHasAccessToAppProps,
): Promise<QueryResult> => {
  const {url, emailAddress, dbClient} = props
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
    const result = queryResponse[0] as unknown as MembaApp

    const user = result.users.find((user) => user.emailAddress === emailAddress)

    if (!user) {
      return {
        body: 'Unauthorized',
        statusCode: HttpStatusCode.FORBIDDEN,
      }
    }

    return {
      body: user,
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: `App with URL: ${url} does not exist.`,
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
