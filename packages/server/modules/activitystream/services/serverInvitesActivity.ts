import {
  ServerInvitesEvents,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  isProjectResourceTarget,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import { EventBus } from '@/modules/shared/services/eventBus'
import { addStreamInviteSentOutActivity } from '@/modules/activitystream/services/streamActivity'
import { getStream } from '@/modules/core/repositories/streams'
import { Logger } from '@/logging/logging'

type OnServerInviteCreatedFactoryDeps = {
  getStream: typeof getStream
  logger: Logger
}

const onServerInviteCreatedFactory =
  ({ getStream, logger }: OnServerInviteCreatedFactoryDeps) =>
  async (payload: ServerInvitesEventsPayloads[typeof ServerInvitesEvents.Created]) => {
    const { invite } = payload
    const primaryResourceTarget = invite.resource

    if (!isProjectResourceTarget(primaryResourceTarget)) return

    const userTarget = resolveTarget(invite.target)
    const project = await getStream({ streamId: primaryResourceTarget.resourceId })
    if (!project) {
      logger.warn('No project found for project invite', { invite })
      return
    }

    await addStreamInviteSentOutActivity({
      streamId: project.id,
      inviterId: invite.inviterId,
      inviteTargetEmail: userTarget.userEmail,
      inviteTargetId: userTarget.userId,
      stream: project
    })
  }

export type HandleServerInvitesActivitiesFactoryDeps = {
  eventBus: EventBus
} & OnServerInviteCreatedFactoryDeps

export const handleServerInvitesActivitiesFactory =
  (deps: HandleServerInvitesActivitiesFactoryDeps) => () => {
    const { eventBus } = deps
    const onServerInviteCreated = onServerInviteCreatedFactory(deps)

    const quitters: Array<() => void> = [
      eventBus.listen(
        ServerInvitesEvents.Created,
        async ({ payload }) => await onServerInviteCreated(payload)
      )
    ]

    return () => quitters.forEach((quit) => quit())
  }