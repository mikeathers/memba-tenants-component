import {PromiseResult} from 'aws-sdk/lib/request'
import {AWSError, DynamoDB} from 'aws-sdk'

export type RegisterTenantRequest = {
  id: string
  tenantName: string
  tier: string
  firstName: string
  lastName: string
  emailAddress: string
  password: string
  addressLineOne: string
  addressLineTwo: string
  doorNumber: string
  townCity: string
  postCode: string
}

export type CreateTenantAdminAndUserGroupRequest = Omit<
  RegisterTenantRequest,
  'id' | 'tenantName' | 'tier'
> & {
  tenantName: string
  tenantUrl: string
  tenantId: string
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
