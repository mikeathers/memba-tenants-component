import {AttributeType, BillingMode, ITable, Table} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'
import {RemovalPolicy} from 'aws-cdk-lib'
import CONFIG from '../config'

export class Databases extends Construct {
  public readonly tenantsTable: ITable

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.tenantsTable = this.createTenantsTable({scope: this})
  }

  private createTenantsTable(props: {scope: Construct}) {
    const {scope} = props
    const tableName = CONFIG.STACK_PREFIX
    const tenantsTable = new Table(scope, tableName, {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: tableName,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    })

    // tenantsTable.addGlobalSecondaryIndex({
    //   indexName: 'tenantName',
    //   partitionKey: {
    //     name: 'tenantName',
    //     type: AttributeType.STRING,
    //   },
    // })

    return tenantsTable
  }
}
