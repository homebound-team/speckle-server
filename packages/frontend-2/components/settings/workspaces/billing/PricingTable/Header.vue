<template>
  <div class="flex flex-col gap-y-1 font-normal">
    <h4 class="text-foreground text-body-xs">
      Workspace
      <span class="capitalize">{{ plan.name }}</span>
    </h4>
    <p class="text-foreground text-heading">
      £{{
        isYearlyPlan
          ? plan.cost.yearly[Roles.Workspace.Member]
          : plan.cost.monthly[Roles.Workspace.Member]
      }}
      per seat/month
    </p>
    <p class="text-foreground-2 text-body-2xs pt-1">
      Billed {{ isYearlyPlan ? 'annually' : 'monthly' }}
    </p>
    <div v-if="workspaceId" class="w-full">
      <FormButton
        :color="buttonColor"
        :disabled="!buttonEnabled"
        class="mt-3"
        full-width
        @click="onUpgradePlanClick(plan.name)"
      >
        {{ buttonText }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PricingPlan, isPaidPlan } from '@/lib/billing/helpers/types'
import { Roles } from '@speckle/shared'
import {
  type WorkspacePlan,
  type PaidWorkspacePlans,
  WorkspacePlanStatuses,
  WorkspacePlans,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { startCase } from 'lodash'

const props = defineProps<{
  plan: PricingPlan
  isYearlyPlan: boolean
  // The following props are optional if the table is for informational purposes
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
  activeBillingInterval?: BillingInterval
}>()

const { redirectToCheckout, upgradePlan } = useBillingActions()

const canUpgradeToPlan = computed(() => {
  if (!props.currentPlan) return false

  const allowedUpgrades: Record<WorkspacePlans, WorkspacePlans[]> = {
    [WorkspacePlans.Starter]: [WorkspacePlans.Plus, WorkspacePlans.Business],
    [WorkspacePlans.Plus]: [WorkspacePlans.Business],
    [WorkspacePlans.Business]: [],
    [WorkspacePlans.Academia]: [],
    [WorkspacePlans.Unlimited]: []
  }

  return allowedUpgrades[props.currentPlan.name].includes(props.plan.name)
})
const hasTrialPlan = computed(
  () => props.currentPlan?.status === WorkspacePlanStatuses.Trial || !props.currentPlan
)
const buttonColor = computed(() => {
  // If on trial plan highlight starter plan
  if (hasTrialPlan.value) {
    return props.plan.name === WorkspacePlans.Starter ? 'primary' : 'outline'
  }
  // Else highlight current plan
  return props.currentPlan?.name === props.plan.name ? 'primary' : 'outline'
})
const isMatchingInterval = computed(
  () =>
    props.activeBillingInterval ===
    (props.isYearlyPlan ? BillingInterval.Yearly : BillingInterval.Monthly)
)
const buttonEnabled = computed(() => {
  // Always enable buttons during trial
  if (hasTrialPlan.value) return true

  // Disable if user is already on this plan with same billing interval
  if (isMatchingInterval.value && props.currentPlan?.name === props.plan.name)
    return false

  // Handle billing interval changes
  if (!isMatchingInterval.value) {
    const isCurrentPlan = props.currentPlan?.name === props.plan.name
    const isMonthlyToYearly =
      props.isYearlyPlan && props.activeBillingInterval === BillingInterval.Monthly
    // Allow yearly upgrades from monthly plans
    if (isMonthlyToYearly) return isCurrentPlan || canUpgradeToPlan.value
    // Never allow switching to monthly if currently on yearly billing
    if (props.activeBillingInterval === BillingInterval.Yearly) return false
    // Allow monthly plan changes only for upgrades
    return canUpgradeToPlan.value
  }

  // Allow upgrades to higher tier plans
  return canUpgradeToPlan.value
})
const buttonText = computed(() => {
  // Trial plan case
  if (hasTrialPlan.value) {
    return `Subscribe to ${startCase(props.plan.name)}`
  }
  // Current plan case
  if (isMatchingInterval.value && props.currentPlan?.name === props.plan.name) {
    return 'Current plan'
  }
  // Billing interval change case
  if (!isMatchingInterval.value || !canUpgradeToPlan.value) {
    return props.isYearlyPlan ? 'Change to annual plan' : 'Change to monthly plan'
  }
  // Upgrade case
  return canUpgradeToPlan.value ? `Upgrade to ${startCase(props.plan.name)}` : ''
})

const onUpgradePlanClick = (plan: WorkspacePlans) => {
  if (!isPaidPlan(plan) || !props.workspaceId) return
  if (hasTrialPlan.value) {
    redirectToCheckout({
      plan: plan as unknown as PaidWorkspacePlans,
      cycle: props.isYearlyPlan ? BillingInterval.Yearly : BillingInterval.Monthly,
      workspaceId: props.workspaceId
    })
  } else {
    upgradePlan({
      plan: plan as unknown as PaidWorkspacePlans,
      cycle: props.isYearlyPlan ? BillingInterval.Yearly : BillingInterval.Monthly,
      workspaceId: props.workspaceId
    })
  }
}
</script>
