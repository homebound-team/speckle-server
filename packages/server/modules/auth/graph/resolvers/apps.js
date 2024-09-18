const { ForbiddenError } = require('@/modules/shared/errors')
const {
  getAllPublicApps,
  getAllAppsCreatedByUser,
  getAllAppsAuthorizedByUser,
  createApp,
  updateApp,
  deleteApp,
  revokeExistingAppCredentialsForUser
} = require('../../services/apps')
const { Roles } = require('@speckle/shared')
const { getAppFactory } = require('@/modules/auth/repositories/apps')
const { db } = require('@/db/knex')

const getApp = getAppFactory({ db })

module.exports = {
  Query: {
    async app(parent, args) {
      const app = await getApp({ id: args.id })
      return app
    },

    async apps() {
      return await getAllPublicApps()
    }
  },

  ServerApp: {
    secret(parent, args, context) {
      if (
        context.auth &&
        parent.author &&
        parent.author.id &&
        parent.author.id === context.userId
      )
        return parent.secret

      return 'App secrets are only revealed to their author 😉'
    },
    async scopes(parent, args, context) {
      if (parent.scopes?.length) return parent.scopes
      return await context.loaders.apps.getAppScopes.load(parent.id)
    }
  },

  User: {
    async authorizedApps(parent, args, context) {
      const res = await getAllAppsAuthorizedByUser({ userId: context.userId })
      return res
    },
    async createdApps(parent, args, context) {
      return await getAllAppsCreatedByUser({ userId: context.userId })
    }
  },
  Mutation: {
    async appCreate(parent, args, context) {
      const { id } = await createApp({ ...args.app, authorId: context.userId })
      return id
    },

    async appUpdate(parent, args, context) {
      const app = await getApp({ id: args.app.id })
      // only admins can update the default apps, generated by the server
      if (!app.author && context.role !== Roles.Server.Admin)
        throw new ForbiddenError('You are not authorized to edit this app.')
      // only the author or an admin can update a 3rd party app
      if (app.author.id !== context.userId && context.role !== Roles.Server.Admin)
        throw new ForbiddenError('You are not authorized to edit this app.')

      await updateApp({ app: args.app })
      return true
    },

    async appDelete(parent, args, context) {
      const app = await getApp({ id: args.appId })
      if (!app) {
        //Possibly ould have been an UserInputError, but
        //we do not want to leak the existence of any app
        //the user may not own or have access to.
        throw new ForbiddenError('You are not authorized to edit this app.')
      }

      if (!app.author && context.role !== Roles.Server.Admin)
        throw new ForbiddenError('You are not authorized to edit this app.')
      if (app.author.id !== context.userId && context.role !== Roles.Server.Admin)
        throw new ForbiddenError('You are not authorized to edit this app.')

      return (await deleteApp({ id: args.appId })) === 1
    },

    async appRevokeAccess(parent, args, context) {
      return await revokeExistingAppCredentialsForUser({
        appId: args.appId,
        userId: context.userId
      })
    }
  }
}
