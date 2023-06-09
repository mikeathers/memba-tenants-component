import CONFIG from '../config'
import {Cors, CorsOptions, LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Construct} from 'constructs'
import {IFunction} from 'aws-cdk-lib/aws-lambda'
import {ARecord, IHostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ICertificate} from 'aws-cdk-lib/aws-certificatemanager'
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'

interface TenantsApiProps {
  scope: Construct
  stage: string
  certificate: ICertificate
  hostedZone: IHostedZone
  tenantsLambda: IFunction
}

export class TenantsApi {
  constructor(props: TenantsApiProps) {
    this.createTenantsApi(props)
  }

  private createTenantsApi(props: TenantsApiProps) {
    const {scope, stage, certificate, tenantsLambda, hostedZone} = props
    const restApiName = `${CONFIG.STACK_PREFIX}Api (${stage})`

    const optionsWithCors: CorsOptions = {
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
      ],
      allowCredentials: true,
    }

    const domainName = stage === 'prod' ? CONFIG.API_URL : CONFIG.DEV_API_URL

    const api = new RestApi(scope, restApiName, {
      restApiName,
      domainName: {
        domainName,
        certificate,
      },
    })

    tenantsLambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))

    api.root.addCorsPreflight(optionsWithCors)

    api.root
      .addResource('create-a-record')
      .addMethod('POST', new LambdaIntegration(tenantsLambda))

    new ARecord(scope, `${CONFIG.STACK_PREFIX}ApiAliasRecord`, {
      recordName: domainName,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(api)),
    })
  }
}
