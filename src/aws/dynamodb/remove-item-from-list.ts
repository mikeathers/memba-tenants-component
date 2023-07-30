import {DynamoDB} from 'aws-sdk'

interface RemoveItemFromListProps<T> {
  dbClient: DynamoDB.DocumentClient
  tableName: string
  itemId: string
  listName: string
  itemToRemove: T
  list: T[]
}

export const removeItemFromList = async <T>(props: RemoveItemFromListProps<T>) => {
  const {tableName, listName, itemId: id, itemToRemove, list, dbClient} = props
  const listWithoutItem = list.filter((item) => item !== itemToRemove)
  const itemExpressionKey = `:${listName}`
  const params = {
    TableName: tableName,
    Key: {id},
    UpdateExpression: `SET ${listName} = :${listName}`,
    ExpressionAttributeValues: {
      [itemExpressionKey]: listWithoutItem,
    },
    ReturnValues: 'ALL_NEW',
  }

  await dbClient.update(params).promise()
}
