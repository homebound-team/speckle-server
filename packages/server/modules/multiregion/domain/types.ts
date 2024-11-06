import { z } from 'zod'
import {
  multiRegionConfigSchema,
  regionServerConfigSchema
} from '@/modules/multiregion/helpers/validation'
import { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Nullable } from '@speckle/shared'

export type AllRegionsConfig = z.infer<typeof multiRegionConfigSchema>
export type MainRegionConfig = AllRegionsConfig['main']
export type MultiRegionConfig = AllRegionsConfig['regions']
export type RegionServerConfig = z.infer<typeof regionServerConfigSchema>

export type ServerRegion = RegionRecord

export type RegionKey = Nullable<string>
export type ProjectRegion = {
  projectId: string
  regionKey: RegionKey
}
