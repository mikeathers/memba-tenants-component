import {EventBridge} from 'aws-sdk'
import {CreateTenantAdminAndUserGroupRequest} from '../../types'
import {getEnv} from '../../utils'

const eventBridge = new EventBridge()

export const publishCreateTenantAdminAndUserGroupEvent = async (
  requestDetails: CreateTenantAdminAndUserGroupRequest,
) => {
  const eventBusName = getEnv('EVENT_BUS_ARN')
  const params = {
    Entries: [
      {
        Source: 'UserAdmin',
        Detail: JSON.stringify(requestDetails),
        DetailType: 'CreateTenantAdminAndUserGroup',
        Time: new Date(),
        EventBusName: eventBusName,
      },
    ],
  }

  await eventBridge.putEvents(params).promise()
}
