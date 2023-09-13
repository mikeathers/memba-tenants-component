import {DynamoDB, SecretsManager} from 'aws-sdk'
import {HttpStatusCode, QueryResult, SecretResult} from '../../types'
import {getByPrimaryKey} from '../../aws/dynamodb'

interface GetAccountByIdProps {
  id: string
  dbClient: DynamoDB.DocumentClient
  isAdmin: boolean
  tenantIdFromClaims: string
  apiKeyToCheck: string
}
export const getTenantById = async (props: GetAccountByIdProps): Promise<QueryResult> => {
  const {id, dbClient, isAdmin, tenantIdFromClaims, apiKeyToCheck} = props

  const tableName = process.env.TENANTS_TABLE_NAME ?? ''
  const tenantsApiSecretName = process.env.TENANTS_API_SECRET_NAME ?? ''

  const queryKey = 'id'
  const queryValue = id

  console.log({queryKey, queryValue, isAdmin, tenantIdFromClaims, apiKeyToCheck})

  const params = {
    SecretId: tenantsApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = await secretsManager.getSecretValue(params).promise()
  const parsedApiKey = JSON.parse(apiKey.SecretString || '') as SecretResult

  console.log({parsedApiKey})
  console.log('parsed api key', parsedApiKey.api_key)

  const isAuthorizedByApiKey = parsedApiKey.api_key === apiKeyToCheck

  console.log({isAuthorized: isAuthorizedByApiKey})

  if (!isAuthorizedByApiKey && (!isAdmin || tenantIdFromClaims !== id)) {
    return {
      body: 'Unauthorized',
      statusCode: HttpStatusCode.FORBIDDEN,
    }
  }

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
