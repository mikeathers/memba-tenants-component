import {Construct} from 'constructs'
import {Duration, Stack, StackProps} from 'aws-cdk-lib'
import CONFIG from './config'
import {getHostedZone} from './aws/route53'
import {createCertificate} from './aws/certificate'
import {TenantsLambda} from './lambdas'
import {TenantsApi} from './api-gateway'
import {Databases} from './databases'
import {Queue} from 'aws-cdk-lib/aws-sqs'
import {UserPool} from 'aws-cdk-lib/aws-cognito'

interface MembaTenantsComponentStackProps extends StackProps {
  stage: string
}

export class MembaTenantsComponentStack extends Stack {
  constructor(scope: Construct, id: string, props: MembaTenantsComponentStackProps) {
    super(scope, id, props)
    const {stage} = props

    const accountId = Stack.of(this).account
    const region = Stack.of(this).region

    const eventBusArn = `arn:aws:events:${region}:${accountId}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}`

    const hostedZoneUrl = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME
    const hostedZone = getHostedZone({scope: this, domainName: hostedZoneUrl})

    const userPoolArn =
      stage === 'prod' ? CONFIG.PROD_USER_POOL_ARN : CONFIG.DEV_USER_POOL_ARN

    const userPool = UserPool.fromUserPoolArn(
      this,
      `${CONFIG.STACK_PREFIX}UserPool`,
      userPoolArn,
    )

    const apiCertificate = createCertificate({
      scope: this,
      hostedZone,
      name: `${CONFIG.STACK_PREFIX}ApiCertificate`,
      url: stage === 'prod' ? CONFIG.API_URL : CONFIG.DEV_API_URL,
      region: 'eu-west-2',
    })

    const database = new Databases(this, `${CONFIG.STACK_PREFIX}Databases`)

    const deadLetterQueue = new Queue(this, `${CONFIG.STACK_PREFIX}-DLQ`, {
      retentionPeriod: Duration.days(7),
      queueName: `${CONFIG.STACK_PREFIX}-DLQ`,
    })

    const {tenantsLambda} = new TenantsLambda({
      scope: this,
      stage,
      hostedZoneId: hostedZone.hostedZoneId,
      tenantsTable: database.tenantsTable,
      appsTable: database.appsTable,
      deadLetterQueue,
      eventBusArn,
      userPool,
    })

    new TenantsApi({
      scope: this,
      stage,
      hostedZone,
      certificate: apiCertificate,
      tenantsLambda: tenantsLambda,
      userPool,
    })
  }
}
