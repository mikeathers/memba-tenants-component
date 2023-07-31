import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode, QueryResult} from '../../types'
import {getByPrimaryKey} from '../../aws/dynamodb'

interface GetAccountByIdProps {
  id: string
  dbClient: DynamoDB.DocumentClient
}
export const getTenantById = async (props: GetAccountByIdProps): Promise<QueryResult> => {
  const {id, dbClient} = props
  const tableName = process.env.TENANTS_TABLE_NAME ?? ''
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
      body: queryResponse,
      statusCode: HttpStatusCode.OK,
    }
  }

  return {
    body: `Account with Id: ${id} does not exist.`,
    statusCode: HttpStatusCode.BAD_REQUEST,
  }
}
