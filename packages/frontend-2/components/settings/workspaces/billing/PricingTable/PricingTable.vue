<template>
  <div class="flex flex-col gap-y-6">
    <div class="flex flex-col lg:flex-row justify-between gap-y-4">
      <slot name="title" />
      <div class="flex items-center gap-x-4">
        <p class="text-foreground-3 text-body-xs">Save 20% with annual billing</p>
        <FormSwitch
          v-model="isYearlyPlan"
          :disabled="activeBillingInterval === BillingInterval.Yearly"
          :show-label="false"
          name="annual billing"
        />
      </div>
    </div>
    <component
      :is="isDesktop ? DesktopTable : MobileTable"
      :is-yearly-plan="isYearlyPlan"
      v-bind="$props"
    />
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { type WorkspacePlan, BillingInterval } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesBillingPricingTable_WorkspacePlan on WorkspacePlan {
    name
    status
    createdAt
  }
`)

const props = defineProps<{
  workspaceId?: string
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  activeBillingInterval?: BillingInterval
  isAdmin?: boolean
}>()

const breakpoints = useBreakpoints(TailwindBreakpoints)

const DesktopTable = defineAsyncComponent(
  () => import('@/components/settings/workspaces/billing/PricingTable/Desktop.vue')
)
const MobileTable = defineAsyncComponent(
  () => import('@/components/settings/workspaces/billing/PricingTable/Mobile.vue')
)
const isDesktop = breakpoints.greaterOrEqual('lg')
const isYearlyPlan = ref(false)

watch(
  () => props.activeBillingInterval,
  (newVal) => {
    isYearlyPlan.value = newVal === BillingInterval.Yearly
  },
  { immediate: true }
)
</script>
