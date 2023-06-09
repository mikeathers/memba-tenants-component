interface ConfigProps {
  STACK_PREFIX: string
  REGION: string
  AWS_ACCOUNT_ID_PROD: string
  AWS_ACCOUNT_ID_DEV: string
  AWS_NO_REPLY_EMAIL_DEV: string
  AWS_NO_REPLY_EMAIL_PROD: string
  FRONTEND_BASE_URL_DEV: string
  FRONTEND_BASE_URL_PROD: string
  DOMAIN_NAME: string
  DEV_DOMAIN_NAME: string
  API_URL: string
  DEV_API_URL: string
}

const CONFIG: ConfigProps = {
  STACK_PREFIX: 'MembaTenants',
  REGION: 'eu-west-2',
  AWS_ACCOUNT_ID_PROD: '635800996936',
  AWS_ACCOUNT_ID_DEV: '544312030237',
  AWS_NO_REPLY_EMAIL_DEV: 'no-reply-dev@memba.co.uk',
  AWS_NO_REPLY_EMAIL_PROD: 'no-reply@memba.co.uk',
  FRONTEND_BASE_URL_DEV: 'https://dev.memba.co.uk',
  FRONTEND_BASE_URL_PROD: 'https://memba.co.uk',
  DOMAIN_NAME: 'memba.co.uk',
  DEV_DOMAIN_NAME: 'dev.memba.co.uk',
  API_URL: 'tenants.memba.co.uk',
  DEV_API_URL: 'tenants.dev.memba.co.uk',
}

export default CONFIG
