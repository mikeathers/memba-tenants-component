import {DynamoDB} from 'aws-sdk'
import {MembaApp} from '../../../types'

interface CreateAppInDbProps {
  dbClient: DynamoDB.DocumentClient
  tableName: string
  item: MembaApp
}

export const createAppInDb = async (props: CreateAppInDbProps) => {
  const {dbClient, tableName, item} = props
  await dbClient
    .put({
      TableName: tableName,
      Item: item,
    })
    .promise()
}
