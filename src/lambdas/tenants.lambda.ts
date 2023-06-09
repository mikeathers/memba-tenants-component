import {IFunction, Runtime, Tracing} from 'aws-cdk-lib/aws-lambda'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {join} from 'path'
import {Duration} from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Construct} from 'constructs'
import {Effect, PolicyStatement} from 'aws-cdk-lib/aws-iam'

import CONFIG from '../config'

interface TenantsLambdaProps {
  scope: Construct
  stage: string
  hostedZoneId: string
}

export class TenantsLambda {
  public tenantsLambda: IFunction

  constructor(props: TenantsLambdaProps) {
    this.tenantsLambda = this.createTenantsLambda(props)
  }

  private createTenantsLambda(props: TenantsLambdaProps): NodejsFunction {
    const {scope, stage, hostedZoneId} = props
    const lambdaName = `${CONFIG.STACK_PREFIX}Lambda-${stage}`
    const accountId =
      stage === 'prod' ? CONFIG.AWS_ACCOUNT_ID_PROD : CONFIG.AWS_ACCOUNT_ID_DEV

    const lambdaProps: NodejsFunctionProps = {
      functionName: lambdaName,
      environment: {
        HOSTED_ZONE_ID: hostedZoneId,
        STAGE: stage,
      },
      runtime: Runtime.NODEJS_16_X,
      reservedConcurrentExecutions: 1,
      timeout: Duration.minutes(1),
      memorySize: 256,
      tracing: Tracing.DISABLED, // Disables Xray
      logRetention: RetentionDays.FIVE_DAYS,
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
        keepNames: true,
        sourceMap: true,
      },
      depsLockFilePath: join(__dirname, '..', '..', 'yarn.lock'),
      retryAttempts: 0,
    }

    const tenantsLambda = new NodejsFunction(scope, lambdaName, {
      entry: join(__dirname, '../handlers/index.ts'),
      ...lambdaProps,
    })

    tenantsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['route53:ChangeResourceRecordSets'],
        resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
        effect: Effect.ALLOW,
      }),
    )

    tenantsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['acm:RequestCertificate'],
        resources: [`arn:aws:acm:us-east-1:${accountId}:certificate/*`],
        effect: Effect.ALLOW,
      }),
    )

    return tenantsLambda
  }
}
