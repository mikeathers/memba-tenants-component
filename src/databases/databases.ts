import {AttributeType, BillingMode, ITable, Table} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'
import {RemovalPolicy} from 'aws-cdk-lib'
import CONFIG from '../config'

export class Databases extends Construct {
  public readonly tenantsTable: ITable
  public readonly appsTable: ITable

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.tenantsTable = this.createTenantsTable({scope: this})
    this.appsTable = this.createAppsTable({scope: this})
  }

  private createTenantsTable(props: {scope: Construct}) {
    const {scope} = props
    const tableName = CONFIG.STACK_PREFIX
    return new Table(scope, tableName, {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    })
  }

  private createAppsTable(props: {scope: Construct}) {
    const {scope} = props
    const tableName = `${CONFIG.STACK_PREFIX}_Apps`
    const appsTable = new Table(scope, tableName, {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    })

    appsTable.addGlobalSecondaryIndex({
      indexName: 'url',
      partitionKey: {
        name: 'url',
        type: AttributeType.STRING,
      },
    })

    return appsTable
  }
}
