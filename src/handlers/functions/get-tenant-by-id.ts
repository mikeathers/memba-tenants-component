import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, QueryResult} from '../../types'
import {getByPrimaryKey} from '../../aws/dynamodb'

interface GetAccountByIdProps {
  id: string
  dbClient: DynamoDB.DocumentClient
}
export const getTenantById = async (props: GetAccountByIdProps): Promise<QueryResult> => {
  const {id, dbClient} = props
  const tableName = process.env.TABLE_NAME ?? ''
  const queryKey = 'id'
  const queryValue = id

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
        message: 'Account has been found.',
        result: queryResponse,
      },
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: {
      message: `Account with Id: ${id} does not exist.`,
    },
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
