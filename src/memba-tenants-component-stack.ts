import {Construct} from 'constructs'
import {Duration, Stack, StackProps} from 'aws-cdk-lib'
import CONFIG from './config'
import {getHostedZone} from './aws/route53'
import {createCertificate} from './aws/certificate'
import {TenantsLambda} from './lambdas'
import {TenantsApi} from './api-gateway'
import {Databases} from './databases'
import {Queue} from 'aws-cdk-lib/aws-sqs'

interface MembaTenantsComponentStackProps extends StackProps {
  stage: string
}

export class MembaTenantsComponentStack extends Stack {
  constructor(scope: Construct, id: string, props: MembaTenantsComponentStackProps) {
    super(scope, id, props)
    const {stage} = props

    const devEventBusArn = `arn:aws:events:${CONFIG.REGION}:${CONFIG.AWS_ACCOUNT_ID_DEV}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}-${stage}`
    const prodEventBusArn = `arn:aws:events:${CONFIG.REGION}:${CONFIG.AWS_ACCOUNT_ID_PROD}:event-bus/${CONFIG.SHARED_EVENT_BUS_NAME}-${stage}`
    const eventBusArn = stage === 'prod' ? prodEventBusArn : devEventBusArn

    const hostedZoneUrl = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME
    const hostedZone = getHostedZone({scope: this, domainName: hostedZoneUrl})

    const apiCertificate = createCertificate({
      scope: this,
      hostedZone,
      name: `${CONFIG.STACK_PREFIX}ApiCertificate`,
      url: stage === 'prod' ? CONFIG.API_URL : CONFIG.DEV_API_URL,
      region: 'eu-west-2',
    })

    const database = new Databases(this, `${CONFIG.STACK_PREFIX}Databases`)

    const deadLetterQueue = new Queue(this, `${CONFIG.STACK_PREFIX}DLQ`, {
      retentionPeriod: Duration.days(7),
      queueName: `${CONFIG.STACK_PREFIX}DLQ`,
    })

    const {tenantsLambda} = new TenantsLambda({
      scope: this,
      stage,
      hostedZoneId: hostedZone.hostedZoneId,
      table: database.tenantsTable,
      deadLetterQueue,
      eventBusArn,
    })

    new TenantsApi({
      scope: this,
      stage,
      hostedZone,
      certificate: apiCertificate,
      tenantsLambda: tenantsLambda,
    })
  }
}
