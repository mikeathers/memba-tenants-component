import {Route53Client, ChangeResourceRecordSetsCommand} from '@aws-sdk/client-route-53'

export const createTenantARecord = async (props: {
  tenantUrl: string
  hostedZoneUrl: string
  hostedZoneId: string
  route53Client: Route53Client
}) => {
  const {tenantUrl, hostedZoneUrl, hostedZoneId, route53Client} = props
  const input = {
    ChangeBatch: {
      Changes: [
        {
          Action: 'CREATE',
          ResourceRecordSet: {
            Name: tenantUrl,
            AliasTarget: {
              HostedZoneId: hostedZoneId,
              DNSName: hostedZoneUrl,
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
  await route53Client.send(command)
}
