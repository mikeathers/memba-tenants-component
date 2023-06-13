import axios, {AxiosResponse} from 'axios'

interface CheckIfTenantAdminExistsProps {
  usersApiUrl: string
  emailToCheck: string
}

export const checkIfTenantAdminExists = async (props: CheckIfTenantAdminExistsProps) => {
  const {usersApiUrl, emailToCheck} = props

  const result: AxiosResponse = await axios.get(
    `${usersApiUrl}/get-account-by-email/${emailToCheck}`,
  )

  console.log('GET ACCOUNT BY EMAIL RESULT:', result)

  if (result.status === 200) return true
  return false
}
