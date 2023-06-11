import {AttributeType, BillingMode, ITable, Table} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'
import CONFIG from '../config'
import {RemovalPolicy} from 'aws-cdk-lib'

export class Databases extends Construct {
  public readonly tenantsTable: ITable

  constructor(scope: Construct, id: string, stage: string) {
    super(scope, id)

    this.tenantsTable = this.createTenantsTable({scope: this, stage})
  }

  private createTenantsTable(props: {stage: string; scope: Construct}) {
    const {scope, stage} = props
    const tableName = `${CONFIG.STACK_PREFIX}-${stage}`
    const tenantsTable = new Table(scope, tableName, {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    })

    tenantsTable.addGlobalSecondaryIndex({
      indexName: 'name',
      partitionKey: {
        name: 'name',
        type: AttributeType.STRING,
      },
    })

    return tenantsTable
  }
}
