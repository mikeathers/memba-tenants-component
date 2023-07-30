import {DynamoDB} from 'aws-sdk'

interface RemoveItemProps {
  dbClient: DynamoDB.DocumentClient
  tableName: string
  id: string
}

export const removeItem = async (props: RemoveItemProps) => {
  const {tableName, dbClient, id} = props
  const params = {
    TableName: tableName,
    Key: {id},
    ReturnValues: 'ALL_OLD',
  }

  await dbClient.delete(params).promise()
}
