interface ConfigProps {
  STACK_PREFIX: string
  REGION: string
  AWS_ACCOUNT_ID_PROD: string
  AWS_ACCOUNT_ID_DEV: string
  DOMAIN_NAME: string
  DEV_DOMAIN_NAME: string
  API_URL: string
  DEV_API_URL: string
  USERS_API_URL: string
  DEV_USERS_API_URL: string
  SHARED_EVENT_BUS_NAME: string
  DEV_USERS_API_SECRET_NAME: string
  USERS_API_SECRET_NAME: string
  DEV_USER_POOL_ARN: string
  PROD_USER_POOL_ARN: string
  USERS_GROUP_ROLE_ARN: string
  DEV_USER_GROUP_ROLE_ARN: string
}

const CONFIG: ConfigProps = {
  STACK_PREFIX: 'Tenants',
  REGION: 'eu-west-2',
  AWS_ACCOUNT_ID_PROD: '635800996936',
  AWS_ACCOUNT_ID_DEV: '544312030237',
  DOMAIN_NAME: 'memba.co.uk',
  DEV_DOMAIN_NAME: 'dev.memba.co.uk',
  API_URL: 'tenants.memba.co.uk',
  DEV_API_URL: 'tenants.dev.memba.co.uk',
  SHARED_EVENT_BUS_NAME: 'SharedEventBus',
  USERS_API_URL: 'https://users.memba.co.uk',
  DEV_USERS_API_URL: 'https://users.dev.memba.co.uk',
  DEV_USERS_API_SECRET_NAME: 'UsersApiSecret2148637E-4Wtmuz6by0ym',
  USERS_API_SECRET_NAME: 'UsersApiSecret2148637E-QyLf435WqwN1',
  DEV_USER_POOL_ARN:
    'arn:aws:cognito-idp:eu-west-2:544312030237:userpool/eu-west-2_O3gVXNPRu',
  PROD_USER_POOL_ARN:
    'arn:aws:cognito-idp:eu-west-2:635800996936:userpool/eu-west-2_eWg0ysJay',
  DEV_USER_GROUP_ROLE_ARN: 'arn:aws:iam::544312030237:role/Users-UsersGroupRole,',
  USERS_GROUP_ROLE_ARN: 'arn:aws:iam::635800996936:role/Users-UsersGroupRole',
}

export default CONFIG
