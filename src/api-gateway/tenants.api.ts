import CONFIG from '../config'
import {
  ApiKey,
  Cors,
  CorsOptions,
  LambdaIntegration,
  MethodOptions,
  Period,
  RestApi,
  UsagePlanPerApiStage,
  UsagePlanProps,
} from 'aws-cdk-lib/aws-apigateway'
import {Construct} from 'constructs'
import {IFunction} from 'aws-cdk-lib/aws-lambda'
import {ARecord, IHostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ICertificate} from 'aws-cdk-lib/aws-certificatemanager'
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'
import {Secret} from 'aws-cdk-lib/aws-secretsmanager'

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
    const restApiName = `${CONFIG.STACK_PREFIX}-Api`

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
      defaultCorsPreflightOptions: optionsWithCors,
    })

    tenantsLambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))

    const apiKeyMethodOptions: MethodOptions = {
      apiKeyRequired: true,
    }

    const secret = new Secret(scope, `${CONFIG.STACK_PREFIX}ApiSecret`, {
      generateSecretString: {
        generateStringKey: 'api_key',
        secretStringTemplate: JSON.stringify({username: 'web_user'}),
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    })

    const apiKeyName = 'x-api-key'

    const apiKey = new ApiKey(scope, `TenantsApiKey`, {
      apiKeyName,
      description: `APIKey used to access resources`,
      enabled: true,
      value: secret.secretValueFromJson('api_key').unsafeUnwrap(),
    })

    const apiStage: UsagePlanPerApiStage = {
      api,
      stage: api.deploymentStage,
    }

    const usagePlanProps: UsagePlanProps = {
      name: 'TenantsApiUsagePlan',
      apiStages: [apiStage],
      throttle: {burstLimit: 500, rateLimit: 1000},
      quota: {limit: 10000000, period: Period.MONTH},
    }

    const usagePlan = api.addUsagePlan('TenantsUsagePlan', usagePlanProps)
    usagePlan.addApiKey(apiKey)

    api.root
      .addResource('register-tenant')
      .addMethod('POST', new LambdaIntegration(tenantsLambda), apiKeyMethodOptions)

    api.root
      .addResource('create-tenant')
      .addMethod('POST', new LambdaIntegration(tenantsLambda), apiKeyMethodOptions)

    new ARecord(scope, `${CONFIG.STACK_PREFIX}ApiAliasRecord`, {
      recordName: domainName,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(api)),
    })
  }
}
