import {EventBridge} from 'aws-sdk'
import {RegisterTenantRequest} from '../../types'
import {getEnv} from '../../utils'

const eventBridge = new EventBridge()

export const publishTenantRegisteredLogEvent = async (
  requestDetails: Omit<RegisterTenantRequest, 'password' | 'id'>,
) => {
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'TenantEventLog',
        Detail: JSON.stringify(requestDetails),
        DetailType: 'Create',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}
