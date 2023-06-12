import {Route53Client, ChangeResourceRecordSetsCommand} from '@aws-sdk/client-route-53'
import CONFIG from '../../config'
import {HttpStatusCode} from '../../types'

export const createTenantARecord = async (props: {
  tenantName: string
  hostedZoneId: string
  stage: string
  route53Client: Route53Client
}) => {
  const {tenantName, hostedZoneId, stage, route53Client} = props
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
  const response = await route53Client.send(command)

  return {
    body: {
      message: 'A Record created successfully!',
      result: response,
    },
    statusCode: HttpStatusCode.CREATED,
  }
}
