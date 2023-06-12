import {DynamoDB} from 'aws-sdk'
import {RegisterTenantRequest} from '../../types'

interface CreateTenantInDbProps {
  dbClient: DynamoDB.DocumentClient
  tableName: string
  item: Omit<RegisterTenantRequest, 'tenantAdminPassword'>
}

export const createTenantInDb = async (props: CreateTenantInDbProps) => {
  const {dbClient, tableName, item} = props
  await dbClient
    .put({
      TableName: tableName,
      Item: item,
    })
    .promise()
}
