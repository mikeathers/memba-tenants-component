import mockAxios from 'jest-mock-axios'

import {checkIfTenantAdminExists} from './check-if-tenant-admin-exists'
import {createAxiosResponse} from '../../test-support'

jest.mock('aws-sdk')

const exampleResponse = {
  ARN: 'x',
  Name: 'test_creds',
  VersionId: 'x',
  SecretString: '{"api_key":"test","username":"password"}',
  VersionStages: ['x'],
  CreatedDate: 'x',
}

jest.mock('aws-sdk', () => {
  return {
    SecretsManager: function () {
      return {
        getSecretValue: function ({SecretId}: {SecretId: string}) {
          {
            if (SecretId === 'testSecretName') {
              return {
                promise: function () {
                  return exampleResponse
                },
              }
            } else {
              throw new Error('mock error')
            }
          }
        },
      }
    },
  }
})

describe('Tenant Handler Functions', () => {
  describe('Check if tenant admin exists', () => {
    const props = {
      usersApiUrl: 'https://users.memba.co.uk',
      emailToCheck: 'testemail@email.com',
      usersApiSecretName: 'testSecretName',
    }

    it('should return true is tenant exists', async () => {
      mockAxios.request.mockResolvedValue(
        createAxiosResponse(200, {
          emailAddress: props.emailToCheck,
        }),
      )

      const result = await checkIfTenantAdminExists(props)

      expect(result).toBeTruthy()
    })
  })
})
