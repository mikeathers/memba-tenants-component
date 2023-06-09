import {Route53Client, ChangeResourceRecordSetsCommand} from '@aws-sdk/client-route-53'
import CONFIG from '../../config'
import {HttpStatusCode} from '../../types'

export const createTenantARecord = async (props: {
  tenantName: string
  hostedZoneId: string
  stage: string
}) => {
  const {tenantName, hostedZoneId, stage} = props
  const client = new Route53Client({region: CONFIG.REGION})
  const url = stage === 'prod' ? CONFIG.DOMAIN_NAME : CONFIG.DEV_DOMAIN_NAME
  const tenantUrl = `${tenantName}.${url}`
  const input = {
    ChangeBatch: {
      Changes: [
        {
          Action: 'CREATE',
          ResourceRecordSet: {
            Name: tenantUrl,
            AliasTarget: {
              HostedZoneId: hostedZoneId,
              DNSName: url,
              EvaluateTargetHealth: true,
            },
            Type: 'A',
          },
        },
      ],
    },
    HostedZoneId: hostedZoneId,
  }

  const command = new ChangeResourceRecordSetsCommand(input)
  const response = await client.send(command)

  return {
    body: {
      message: 'A Record created successfully!',
      result: response,
    },
    statusCode: HttpStatusCode.CREATED,
  }
}
