import {ListResourceRecordSetsCommand, Route53Client} from '@aws-sdk/client-route-53'
import {ResourceRecordSet} from '@aws-sdk/client-route-53/dist-types/models/models_0'

interface GetTenantARecordProps {
  hostedZoneId: string
  tenantName: string
  route53Client: Route53Client
}

export const getTenantARecord = async (props: GetTenantARecordProps) => {
  const {hostedZoneId, tenantName, route53Client} = props
  const params = {
    HostedZoneId: hostedZoneId,
    StartRecordType: 'A',
  }

  const command = new ListResourceRecordSetsCommand(params)
  const response = await route53Client.send(command)

  if (response.ResourceRecordSets) {
    return response.ResourceRecordSets.find((item: ResourceRecordSet) =>
      item.Name?.includes(tenantName),
    )
  }

  return null
}
