import CONFIG from '../config'
import {Cors, CorsOptions, LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Construct} from 'constructs'
import {IFunction} from 'aws-cdk-lib/aws-lambda'
import {ARecord, IHostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ICertificate} from 'aws-cdk-lib/aws-certificatemanager'
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'

interface RegistrationApiProps {
  scope: Construct
  stage: string
  certificate: ICertificate
  hostedZone: IHostedZone
  registrationLambda: IFunction
}

export class RegistrationApi {
  constructor(props: RegistrationApiProps) {
    this.createRegistrationApi(props)
  }

  private createRegistrationApi(props: RegistrationApiProps) {
    const {scope, stage, certificate, registrationLambda, hostedZone} = props
    const restApiName = `${CONFIG.STACK_PREFIX} Registration Api (${stage})`

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

    const domainName =
      stage === 'prod' ? CONFIG.REGISTRATION_API_URL : CONFIG.DEV_REGISTRATION_API_URL

    const api = new RestApi(scope, restApiName, {
      restApiName,
      domainName: {
        domainName,
        certificate,
      },
    })

    registrationLambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))

    api.root.addCorsPreflight(optionsWithCors)

    api.root
      .addResource('create-a-record')
      .addMethod('POST', new LambdaIntegration(registrationLambda))

    new ARecord(scope, `${CONFIG.STACK_PREFIX}RegistrationApiAliasRecord`, {
      recordName: domainName,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(api)),
    })
  }
}
