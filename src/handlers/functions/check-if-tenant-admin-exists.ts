import axios, {AxiosResponse} from 'axios'
import {SecretsManager} from 'aws-sdk'

interface CheckIfTenantAdminExistsProps {
  usersApiUrl: string
  emailToCheck: string
  usersApiSecretName: string
}

interface SecretResult {
  api_key: string
  username: string
}

const httpClient = axios.create()

export const checkIfTenantAdminExists = async (props: CheckIfTenantAdminExistsProps) => {
  const {usersApiUrl, emailToCheck, usersApiSecretName} = props
  const params = {
    SecretId: usersApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = await secretsManager.getSecretValue(params).promise()

  if ('SecretString' in apiKey) {
    const parsedApiKey = JSON.parse(apiKey.SecretString || '') as SecretResult

    const result: AxiosResponse = await httpClient.request({
      url: `${usersApiUrl}/get-account-by-email/${emailToCheck}`,
      method: 'GET',
      headers: {
        ['x-api-key']: parsedApiKey.api_key,
      },
    })

    console.log('GET ACCOUNT BY EMAIL RESULT:', result)

    if (result.status === 200) return true
    return false
  }
  return false
}
