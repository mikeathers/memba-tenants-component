import {PromiseResult} from 'aws-sdk/lib/request'
import {AWSError, DynamoDB} from 'aws-sdk'

export type TenantDetails = {
  tenantName: string
  tier: string
}

export type RegisterTenantRequest = {
  id: string
  name: string
  tier: string
  tenantAdminFirstName: string
  tenantAdminLastName: string
  tenantAdminEmail: string
  tenantAdminPassword: string
}

export type CreateTenantAdminAndUserGroupRequest = {
  tenantName: string
  tenantAdminFirstName: string
  tenantAdminLastName: string
  tenantAdminEmail: string
  tenantAdminPassword: string
}

export type CreateAccountRequest = {
  id: string
  addressLineOne: string
  addressLineTwo: string
  doorNumber: string
  townCity: string
  postCode: string
  authenticatedUserId: string
  comment: string
  firstName: string
  lastName: string
  emailAddress: string
}

export type UpdateAccountRequest = Pick<
  CreateAccountRequest,
  | 'id'
  | 'doorNumber'
  | 'addressLineOne'
  | 'addressLineTwo'
  | 'townCity'
  | 'postCode'
  | 'lastName'
  | 'firstName'
  | 'emailAddress'
>

export type QueryResult = {
  body: {
    message?: string
    result?:
      | PromiseResult<DynamoDB.DocumentClient.PutItemOutput, AWSError>
      | string
      | DynamoDB.DocumentClient.AttributeMap
  }
  statusCode: number
}

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  MULTI_STATUS = 207,
  BAD_REQUEST = 400,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER = 500,
}
