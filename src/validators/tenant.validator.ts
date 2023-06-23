import {RegisterTenantRequest} from '../types'

export class MissingFieldError extends Error {}

// eslint-disable-next-line
export const validateRegisterTenantRequest = (arg: RegisterTenantRequest): void => {
  if (!arg.tenantName) {
    throw new MissingFieldError('Value for name required!')
  }
  if (!arg.tier) {
    throw new MissingFieldError('Value for tier required!')
  }
  if (!arg.id) {
    throw new MissingFieldError('Value for Id required!')
  }
  if (!arg.lastName) {
    throw new MissingFieldError('Value for lastName required!')
  }
  if (!arg.firstName) {
    throw new MissingFieldError('Value for firstName required!')
  }
  if (!arg.emailAddress) {
    throw new MissingFieldError('Value for emailAddress required!')
  }
  if (!arg.password) {
    throw new MissingFieldError('Value for password required!')
  }
}
