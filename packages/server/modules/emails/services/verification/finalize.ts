import { Optional } from '@speckle/shared'
import { markUserAsVerified } from '@/modules/core/repositories/users'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import {
  deleteVerificationsFactory,
  getPendingTokenFactory
} from '@/modules/emails/repositories'
import { db } from '@/db/knex'

async function initializeState(tokenId: Optional<string>) {
  if (!tokenId)
    throw new EmailVerificationFinalizationError('Missing verification token')

  const token = await getPendingTokenFactory({ db })({ token: tokenId })
  if (!token)
    throw new EmailVerificationFinalizationError(
      'Invalid or expired verification token'
    )

  return { token }
}

type FinalizationState = Awaited<ReturnType<typeof initializeState>>

async function finalizeVerification(state: FinalizationState) {
  const { token } = state
  const { email } = token

  await Promise.all([
    markUserAsVerified(email),
    deleteVerificationsFactory({ db })(email)
  ])
}

/**
 * Finalize the email verification process
 */
export async function finalizeEmailVerification(tokenId: Optional<string>) {
  const state = await initializeState(tokenId)
  await finalizeVerification(state)
}
