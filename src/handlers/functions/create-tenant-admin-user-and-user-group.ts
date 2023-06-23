import axios, {AxiosResponse} from 'axios'
import {SecretsManager} from 'aws-sdk'
import {CreateTenantAdminAndUserGroupRequest} from '../../types'

type CreateTenantAdminUserAndUserGroupProps = CreateTenantAdminAndUserGroupRequest & {
  usersApiUrl: string
  usersApiSecretName: string
}

interface SecretResult {
  api_key: string
  username: string
}

const httpClient = axios.create()

export const createTenantAdminUserAndUserGroup = async (
  props: CreateTenantAdminUserAndUserGroupProps,
) => {
  const {usersApiUrl, usersApiSecretName, ...rest} = props
  const params = {
    SecretId: usersApiSecretName,
  }

  try {
    const secretsManager = new SecretsManager()
    const apiKey = await secretsManager.getSecretValue(params).promise()

    if ('SecretString' in apiKey) {
      const parsedApiKey = JSON.parse(apiKey.SecretString || '') as SecretResult

      const result: AxiosResponse = await httpClient.request({
        url: `${usersApiUrl}/create-tenant-admin-account`,
        method: 'POST',
        data: {...rest},
        headers: {
          ['x-api-key']: parsedApiKey.api_key,
        },
      })

      console.log('CREATE ADMIN USER RESULT:', result)
    }
  } catch (error) {
    console.log('CREATE ADMIN USER ERROR: ', error)
    throw error
  }
}
