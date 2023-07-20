import {DynamoDB} from 'aws-sdk'
import {getByPrimaryKey} from '../../aws/dynamodb'
import {HttpStatusCode} from '../../types'

interface RollbackCreateTenantProps {
  id: string
  tableName: string
  dbClient: DynamoDB.DocumentClient
}
export const rollbackCreateTenant = async (props: RollbackCreateTenantProps) => {
  const {id, dbClient, tableName} = props

  try {
    const accountExists = await getByPrimaryKey({
      queryKey: 'id',
      queryValue: id,
      tableName,
      dbClient,
    })

    console.log('DELETE - ACCOUNT EXISTS: ', accountExists)

    if (!accountExists) return

    const params = {
      TableName: tableName,
      Key: {id},
      ReturnValues: 'ALL_OLD',
    }

    const result = await dbClient.delete(params).promise()
    console.log('DELETE TENANT RESULT: ', result)
  } catch (error) {
    console.log('ROLLBACK CREATE TENANT ERROR: ', error)
  }
}
