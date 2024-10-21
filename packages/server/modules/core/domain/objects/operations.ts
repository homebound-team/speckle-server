import { Logger } from '@/logging/logging'
import {
  InsertableSpeckleObject,
  RawSpeckleObject,
  SpeckleObject,
  SpeckleObjectClosureEntry
} from '@/modules/core/domain/objects/types'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import { Optional } from '@speckle/shared'
import { Knex } from 'knex'

export type GetStreamObjects = (
  streamId: string,
  objectIds: string[]
) => Promise<SpeckleObject[]>

export type GetObject = (
  objectId: string,
  streamId: string
) => Promise<Optional<SpeckleObject>>

export type GetBatchedStreamObjects = (
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<SpeckleObject[], void, unknown>

export type StoreObjects = (
  objects: SpeckleObject[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>

export type StoreSingleObjectIfNotFound = (
  object: SpeckleObject | InsertableSpeckleObject
) => Promise<void>

export type StoreObjectsIfNotFound = (
  objects: Array<SpeckleObject | InsertableSpeckleObject>
) => Promise<void>

export type StoreClosuresIfNotFound = (
  closures: SpeckleObjectClosureEntry[]
) => Promise<void>

export type CreateObject = (params: {
  streamId: string
  object: RawSpeckleObject
  logger?: Logger
}) => Promise<string>

type CreateObjectsParams = {
  streamId: string
  objects: RawSpeckleObject[]
  logger?: Logger
}

export type CreateObjectsBatched = (params: CreateObjectsParams) => Promise<boolean>

export type CreateObjectsBatchedAndNoClosures = (
  params: CreateObjectsParams
) => Promise<string[]>

export type CreateObjects = (params: CreateObjectsParams) => Promise<string[]>
