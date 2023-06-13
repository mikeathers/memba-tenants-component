import axios, {AxiosResponse} from 'axios'
import {SecretsManager} from 'aws-sdk'

interface CheckIfTenantAdminExistsProps {
  usersApiUrl: string
  emailToCheck: string
  usersApiSecretName: string
}

export const checkIfTenantAdminExists = async (props: CheckIfTenantAdminExistsProps) => {
  const {usersApiUrl, emailToCheck, usersApiSecretName} = props
  const params = {
    SecretId: usersApiSecretName,
  }

  const secretsManager = new SecretsManager()
  const apiKey = (await secretsManager.getSecretValue(params).promise()).SecretString

  console.log('API_KEY: ', apiKey)

  const result: AxiosResponse = await axios.get(
    `${usersApiUrl}/get-account-by-email/${emailToCheck}`,
    {
      headers: {
        ['x-api-key']: apiKey,
      },
    },
  )

  console.log('GET ACCOUNT BY EMAIL RESULT:', result)

  if (result.status === 200) return true
  return false
}
