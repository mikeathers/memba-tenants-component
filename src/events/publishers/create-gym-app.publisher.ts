import {EventBridge} from 'aws-sdk'
import {CreateGymAppRequest} from '../../types'
import {getEnv} from '../../utils'

const eventBridge = new EventBridge()

export const publishGymAppLogEvent = async (
  requestDetails: CreateGymAppRequest,
  type: string,
) => {
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'GymAppEventLog',
        Detail: JSON.stringify(requestDetails),
        DetailType: type,
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}
