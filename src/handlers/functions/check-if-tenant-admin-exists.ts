import axios, {AxiosResponse} from 'axios'
import {SecretsManager} from 'aws-sdk'

interface CheckIfTenantAdminExistsProps {
  usersApiUrl: string
  emailToCheck: string
  usersApiSecretName: string
}

interface SecretResult {
  api_key: string
  web_user: string
}

// eslint-disable-next-line
export const secretHasValue = (obj: any): obj is SecretResult => {
  return typeof obj === 'object' && 'api_key' in obj
}

export const checkIfTenantAdminExists = async (props: CheckIfTenantAdminExistsProps) => {
  const {usersApiUrl, emailToCheck, usersApiSecretName} = props
  const params = {
    SecretId: usersApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = (await secretsManager.getSecretValue(params).promise()).SecretString

  if (secretHasValue(apiKey)) {
    const parsedApiKey = apiKey as SecretResult

    console.log('API_KEY: ', parsedApiKey.api_key)

    const result: AxiosResponse = await axios.get(
      `${usersApiUrl}/get-account-by-email/${emailToCheck}`,
      {
        headers: {
          ['x-api-key']: parsedApiKey.api_key,
        },
      },
    )
    console.log('GET ACCOUNT BY EMAIL RESULT:', result)

    if (result.status === 200) return true
    return false
  }
  return false
}
