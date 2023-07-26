import {CreateGymAppRequest, CreateTenantRequest, RegisterTenantRequest} from '../types'

export class MissingFieldError extends Error {}

// eslint-disable-next-line
export const validateCreateTenantRequest = (arg: CreateTenantRequest): void => {
  if (!arg.id) {
    throw new MissingFieldError('Value for Id required!')
  }
  if (arg.admins.length < 1) {
    throw new MissingFieldError('Atleast one tenant admin required!')
  }
}

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

export const validateCreateGymAppRequest = (arg: CreateGymAppRequest): void => {
  if (!arg.gymName) {
    throw new MissingFieldError('Value for gymName is required')
  }
  if (!arg.tier) {
    throw new MissingFieldError('Value for tier is required')
  }
  if (!arg.tenantId) {
    throw new MissingFieldError('Value for tenantId is required')
  }
  if (!arg.memberships) {
    throw new MissingFieldError('Value for memberships is required')
  }
}
