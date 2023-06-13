import {IFunction, Runtime, Tracing} from 'aws-cdk-lib/aws-lambda'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {join} from 'path'
import {Duration} from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Construct} from 'constructs'
import {Effect, PolicyStatement} from 'aws-cdk-lib/aws-iam'

import CONFIG from '../config'
import {Queue} from 'aws-cdk-lib/aws-sqs'
import {ITable} from 'aws-cdk-lib/aws-dynamodb'

interface TenantsLambdaProps {
  scope: Construct
  stage: string
  table: ITable
  hostedZoneId: string
  eventBusArn: string
  deadLetterQueue: Queue
}

export class TenantsLambda {
  public tenantsLambda: IFunction

  constructor(props: TenantsLambdaProps) {
    this.tenantsLambda = this.createTenantsLambda(props)
  }

  private createTenantsLambda(props: TenantsLambdaProps): NodejsFunction {
    const {scope, stage, hostedZoneId, table, eventBusArn, deadLetterQueue} = props
    const lambdaName = `${CONFIG.STACK_PREFIX}Lambda-${stage}`
    const usersApiUrl = stage === 'prod' ? CONFIG.USERS_API_URL : CONFIG.DEV_USERS_API_URL
    const usersApiSecretName =
      stage === 'prod' ? CONFIG.USERS_API_SECRET_NAME : CONFIG.DEV_USERS_API_SECRET_NAME
    const accountId =
      stage === 'prod' ? CONFIG.AWS_ACCOUNT_ID_PROD : CONFIG.AWS_ACCOUNT_ID_DEV

    const lambdaProps: NodejsFunctionProps = {
      functionName: lambdaName,
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: table.tableName,
        EVENT_BUS_ARN: eventBusArn,
        HOSTED_ZONE_ID: hostedZoneId,
        STAGE: stage,
        USERS_API_URL: usersApiUrl,
        USERS_API_SECRET_NAME: usersApiSecretName,
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
      deadLetterQueueEnabled: true,
      deadLetterQueue,
      retryAttempts: 0,
    }

    const tenantsLambda = new NodejsFunction(scope, lambdaName, {
      entry: join(__dirname, '../handlers/index.ts'),
      ...lambdaProps,
    })

    table.grantReadWriteData(tenantsLambda)

    tenantsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['route53:ChangeResourceRecordSets', 'route53:ListResourceRecordSets'],
        resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
        effect: Effect.ALLOW,
      }),
    )

    tenantsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    )

    return tenantsLambda
  }
}
