import {Construct} from 'constructs'
import {Stack, StackProps} from 'aws-cdk-lib'
import CONFIG from './config'
import {getHostedZone} from './aws/route53'
import {createCertificate} from './aws/certificate'
import {TenantsLambda} from './lambdas'
import {TenantsApi} from './api-gateway'

interface MembaTenantsComponentStackProps extends StackProps {
  stage: string
}

export class MembaTenantsComponentStack extends Stack {
  constructor(scope: Construct, id: string, props: MembaTenantsComponentStackProps) {
    super(scope, id, props)
    const {stage} = props

    const hostedZoneUrl = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME

    const hostedZone = getHostedZone({scope: this, domainName: hostedZoneUrl})

    const apiCertificate = createCertificate({
      scope: this,
      hostedZone,
      name: `${CONFIG.STACK_PREFIX}ApiCertificate`,
      url: stage === 'prod' ? CONFIG.API_URL : CONFIG.DEV_API_URL,
      region: 'eu-west-2',
    })

    const {tenantsLambda} = new TenantsLambda({
      scope: this,
      stage,
      hostedZoneId: hostedZone.hostedZoneId,
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
