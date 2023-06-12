import {CreateAccountRequest, RegisterTenantRequest} from '../types'

export class MissingFieldError extends Error {}

// eslint-disable-next-line
export const validateRegisterTenantRequest = (arg: RegisterTenantRequest): void => {
  if (!arg.name) {
    throw new MissingFieldError('Value for name required!')
  }
  if (!arg.tier) {
    throw new MissingFieldError('Value for tier required!')
  }
  if (!arg.id) {
    throw new MissingFieldError('Value for Id required!')
  }
  if (!arg.tenantAdminLastName) {
    throw new MissingFieldError('Value for TenantAdminLastName required!')
  }
  if (!arg.tenantAdminFirstName) {
    throw new MissingFieldError('Value for tenantAdminFirstName required!')
  }
  if (!arg.tenantAdminEmail) {
    throw new MissingFieldError('Value for tenantAdminEmail required!')
  }
  if (!arg.tenantAdminPassword) {
    throw new MissingFieldError('Value for tenantAdminPassword required!')
  }
}
