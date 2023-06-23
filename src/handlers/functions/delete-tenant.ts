import {deleteARecord} from '../../aws/route53'
import {getByPrimaryKey} from '../../aws/dynamodb'
import {DynamoDB} from 'aws-sdk'
import {HttpStatusCode} from '../../types'

interface DeleteTenantProps {
  tenantUrl: string
  hostedZoneUrl: string
  hostedZoneId: string
  tableName: string
  dbClient: DynamoDB.DocumentClient
  tenantId: string
}
export const deleteTenant = async (props: DeleteTenantProps) => {
  const {tenantUrl, hostedZoneUrl, hostedZoneId, tableName, dbClient, tenantId} = props

  try {
    await deleteARecord({tenantUrl, hostedZoneUrl, hostedZoneId})

    const accountExists = await getByPrimaryKey({
      queryKey: 'id',
      queryValue: tenantId,
      tableName,
      dbClient,
    })

    console.log('DELETE - ACCOUNT EXISTS: ', accountExists)

    if (!accountExists?.Item) {
      return {
        body: {
          message: `Account ${tenantId} was not deleted because it does not exist.`,
        },
        statusCode: HttpStatusCode.BAD_REQUEST,
      }
    }

    if (tenantId) {
      const params = {
        TableName: tableName,
        Key: {tenantId},
        ReturnValues: 'ALL_OLD',
      }

      const result = await dbClient.delete(params).promise()
      console.log('DELETE TEnaNT RESULT: ', result)

      return {
        body: {
          message: `Account ${tenantId} has been deleted successfully.`,
          result,
        },
        statusCode: HttpStatusCode.OK,
      }
    }

    return {
      body: {
        message: `Something went wrong`,
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  } catch (error) {
    console.log('DELETE TENANT ERROR: ', error)
    return {
      body: {
        message: `Something went wrong`,
      },
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    }
  }
}
