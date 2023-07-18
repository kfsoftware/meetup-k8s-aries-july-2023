import type { BaseRecord, BaseRecordConstructor, Query, StorageService, TagsBase } from '@aries-framework/core'
import { AgentContext, AriesFrameworkError, Wallet } from '@aries-framework/core'

import { JsonTransformer, RecordDuplicateError, RecordNotFoundError, injectable } from '@aries-framework/core'
import { BrowserWallet } from './BrowserWallet'

interface StorageRecord {
    value: Record<string, unknown>
    tags: Record<string, unknown>
    type: string
    id: string
}
export function assertBrowserWallet(wallet: Wallet): asserts wallet is BrowserWallet {
    if (!(wallet instanceof BrowserWallet)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const walletClassName = (wallet as any).constructor?.name ?? 'unknown'
        throw new AriesFrameworkError(`Expected wallet to be instance of BrowserWallet, found ${walletClassName}`)
    }
}

@injectable()
export class IndexedDBStorageService<T extends BaseRecord<any, any, any> = BaseRecord<any, any, any>>
    implements StorageService<T>
{

    private recordToInstance(record: StorageRecord, recordClass: BaseRecordConstructor<T>): T {
        const instance = JsonTransformer.fromJSON<T>(record.value, recordClass)
        instance.id = record.id
        instance.replaceTags(record.tags as TagsBase)

        return instance
    }


    public async save(agentContext: AgentContext, record: T) {
        record.updatedAt = new Date()
        const value = JsonTransformer.toJSON(record)
        assertBrowserWallet(agentContext.wallet)
        const db = await agentContext.wallet.store.dbPromise
        const tx = db.transaction('records', 'readwrite')
        const store = tx.objectStore('records')
        const existingRecord = await store.get(record.id)

        if (existingRecord) {
            throw new RecordDuplicateError(`Record with id ${record.id} already exists`, { recordType: record.type })
        }

        await store.add({
            value,
            id: record.id,
            type: record.type,
            tags: record.getTags(),
        })

        await tx.done
    }

    public async update(agentContext: AgentContext, record: T): Promise<void> {
        record.updatedAt = new Date()
        const value = JsonTransformer.toJSON(record)
        delete value._tags

        assertBrowserWallet(agentContext.wallet)
        const db = await agentContext.wallet.store.dbPromise
        const tx = db.transaction('records', 'readwrite')
        const store = tx.objectStore('records')
        const existingRecord = await store.get(record.id)

        if (!existingRecord) {
            throw new RecordNotFoundError(`record with id ${record.id} not found.`, {
                recordType: record.type,
            })
        }

        await store.put({
            value,
            id: record.id,
            type: record.type,
            tags: record.getTags(),
        })

        await tx.done
    }

    public async delete(agentContext: AgentContext, record: T) {
        assertBrowserWallet(agentContext.wallet)
        const db = await agentContext.wallet.store.dbPromise
        const tx = db.transaction('records', 'readwrite')
        const store = tx.objectStore('records')
        const existingRecord = await store.get(record.id)

        if (!existingRecord) {
            throw new RecordNotFoundError(`record with id ${record.id} not found.`, {
                recordType: record.type,
            })
        }

        await store.delete(record.id)
        await tx.done
    }

    public async deleteById(
        agentContext: AgentContext,
        recordClass: BaseRecordConstructor<T>,
        id: string
    ): Promise<void> {
        assertBrowserWallet(agentContext.wallet)
        const db = await agentContext.wallet.store.dbPromise
        const tx = db.transaction('records', 'readwrite')
        const store = tx.objectStore('records')
        const existingRecord = await store.get(id)

        if (!existingRecord) {
            throw new RecordNotFoundError(`record with id ${id} not found.`, {
                recordType: recordClass.type,
            })
        }
        await store.delete(id)
        await tx.done
    }

    public async getById(agentContext: AgentContext, recordClass: BaseRecordConstructor<T>, id: string): Promise<T> {
        assertBrowserWallet(agentContext.wallet)
        const db = await agentContext.wallet.store.dbPromise
        const tx = db.transaction('records', 'readonly')
        const store = tx.objectStore('records')
        const record = await store.get(id)

        if (!record) {
            throw new RecordNotFoundError(`record with id ${id} not found.`, {
                recordType: recordClass.type,
            })
        }

        return this.recordToInstance(record, recordClass)
    }

    public async getAll(agentContext: AgentContext, recordClass: BaseRecordConstructor<T>): Promise<T[]> {
        assertBrowserWallet(agentContext.wallet)
        const db = await agentContext.wallet.store.dbPromise
        const tx = db.transaction('records', 'readonly')
        const store = tx.objectStore('records')
        const records = await store.getAll()

        return records
            .filter((record) => record.type === recordClass.type)
            .map((record) => this.recordToInstance(record, recordClass))
    }

    public async findByQuery(
        agentContext: AgentContext,
        recordClass: BaseRecordConstructor<T>,
        query: Query<T>
    ): Promise<T[]> {
        assertBrowserWallet(agentContext.wallet)
        const db = await agentContext.wallet.store.dbPromise
        const tx = db.transaction('records', 'readonly')
        const store = tx.objectStore('records')
        const records = await store.getAll()

        const recordsFiltered = records
            .filter((record) => record.type === recordClass.type)
            .filter((record) => filterByQuery(record, query))
            .map((record) => this.recordToInstance(record, recordClass))
        return recordsFiltered
    }
}
function filterByQuery<T extends BaseRecord<any, any, any>>(record: StorageRecord, query: Query<T>) {
    const { $and, $or, $not, ...restQuery } = query

    if ($not) {
        throw new Error('$not query not supported in in memory storage')
    }

    if (!matchSimpleQuery(record, restQuery)) return false

    if ($and) {
        const allAndMatch = ($and as Query<T>[]).every((and) => filterByQuery(record, and))
        if (!allAndMatch) return false
    }

    if ($or) {
        const oneOrMatch = ($or as Query<T>[]).some((or) => filterByQuery(record, or))
        if (!oneOrMatch) return false
    }

    return true
}

function matchSimpleQuery<T extends BaseRecord<any, any, any>>(record: StorageRecord, query: Query<T>) {
    const tags = record.tags as TagsBase
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
            continue
        }
        if (Array.isArray(value)) {
            const tagValue = tags[key]
            if (!Array.isArray(tagValue) || !value.every((v) => tagValue.includes(v))) {
                return false
            }
        } else if (tags[key] !== value) {
            return false
        }
    }

    return true
}

