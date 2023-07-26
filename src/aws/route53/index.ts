import {Stack} from 'aws-cdk-lib'
import {ARecord, HostedZone, IHostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {IDistribution} from 'aws-cdk-lib/aws-cloudfront'
import {CloudFrontTarget} from 'aws-cdk-lib/aws-route53-targets'
import CONFIG from '../../config'
import {
  ChangeResourceRecordSetsCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53'

export interface GetHostedZoneProps {
  scope: Stack
  domainName: string
}

const route53Client = new Route53Client({region: CONFIG.REGION})

export const getHostedZone = (props: GetHostedZoneProps): IHostedZone => {
  const {scope, domainName} = props

  return HostedZone.fromLookup(scope, `${CONFIG.STACK_PREFIX}HostedZone`, {domainName})
}

export interface CreateARecordForDistributionProps {
  scope: Stack
  hostedZone: IHostedZone
  url: string
  distribution: IDistribution
  name: string
}

export const createARecordForDistribution = (
  props: CreateARecordForDistributionProps,
): ARecord => {
  const {scope, hostedZone, url, distribution, name} = props

  return new ARecord(scope, name, {
    recordName: url,
    target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    zone: hostedZone,
  })
}

export const getARecord = async (props: GetARecordProps) => {
  const {hostedZoneId, aRecord} = props
  const params = {
    HostedZoneId: hostedZoneId,
  }

  const command = new ListResourceRecordSetsCommand(params)
  const response = await route53Client.send(command)
  console.log('LISTED ITEMS: ', response)

  if (response.ResourceRecordSets) {
    return response.ResourceRecordSets.find((item) => item.Name?.includes(aRecord))
  }

  return null
}

export const createARecord = async (props: {
  aRecord: string
  hostedZoneUrl: string
  hostedZoneId: string
}) => {
  const {aRecord, hostedZoneUrl, hostedZoneId} = props
  const input = {
    ChangeBatch: {
      Changes: [
        {
          Action: 'CREATE',
          ResourceRecordSet: {
            Name: aRecord,
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

export const deleteARecord = async (props: {
  aRecord: string
  hostedZoneUrl: string
  hostedZoneId: string
}) => {
  const {aRecord, hostedZoneUrl, hostedZoneId} = props

  const tenantARecordExists = await getARecord({hostedZoneId, aRecord})

  console.log({tenantARecordExists})

  if (!tenantARecordExists) return

  const input = {
    ChangeBatch: {
      Changes: [
        {
          Action: 'DELETE',
          ResourceRecordSet: {
            Name: aRecord,
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
  const result = await route53Client.send(command)
  console.log('DELETE A RECORD RESULT: ', result)
}

interface GetARecordProps {
  hostedZoneId: string
  aRecord: string
}
