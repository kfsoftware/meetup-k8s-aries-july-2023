import type { DownloadToFileOptions, FileSystem } from '@aries-framework/core';
import { AriesFrameworkError, Buffer, TypedArrayEncoder } from '@aries-framework/core';


class IndexedDBStorage {
    private dbName: string;
    private storeName: string;
    private db!: IDBDatabase;
    ready: Promise<void>;
    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.ready = new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName);
            request.onupgradeneeded = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.db.createObjectStore(this.storeName);
            };
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };
            request.onerror = (event) => {
                console.debug(`Database error: ${event}`);
            };
        })

    }

    async setItem(key: string, value: any) {
        console.debug(`Setting ${key} to ${value}`);
        await this.ready;
        return new Promise<void>((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getItem(key: string) {
        console.debug(`Getting ${key}`);
        await this.ready;
        return new Promise<any>((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName]);
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeItem(key: string) {
        console.debug(`Removing ${key}`);
        await this.ready;
        return new Promise<void>((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async hasItem(key: string) {
        console.debug(`Checking if ${key} exists`);
        await this.ready;
        return new Promise<boolean>((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName]);
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.count(key);

            request.onsuccess = () => resolve(request.result > 0);
            request.onerror = () => reject(request.error);
        });
    }
}

export class WebInMemoryFileSystem implements FileSystem {
    public readonly dataPath = '/';
    public readonly cachePath = '/';
    public readonly tempPath = '/';

    private storage = new IndexedDBStorage("aries-framework", "files");

    public async exists(path: string): Promise<boolean> {
        return this.storage.hasItem(path);
    }

    public async createDirectory(path: string): Promise<void> {
        // No need to create directories in-memory
    }

    public async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
        const data = await this.storage.getItem(sourcePath);
        await this.storage.setItem(destinationPath, data);
    }

    public async write(path: string, data: string): Promise<void> {
        await this.storage.setItem(path, data);
    }

    public async read(path: string): Promise<string> {
        return this.storage.getItem(path);
    }

    public async delete(path: string): Promise<void> {
        await this.storage.removeItem(path);
    }

    public async downloadToFile(url: string, path: string, options?: DownloadToFileOptions) {
        const response = await fetch(url);
        const data = await response.text();

        await this.write(path, data);

        if (options?.verifyHash) {
            const fileData = await this.read(path);
            const fileDataBuffer = Buffer.from(fileData, 'utf8');
            const fileHash = await crypto.subtle.digest(options.verifyHash.algorithm, fileDataBuffer);
            const fileHashBuffer = Buffer.from(fileHash);

            if (fileHashBuffer.compare(options.verifyHash.hash) !== 0) {
                await this.delete(path);
                throw new AriesFrameworkError(
                    `Hash of downloaded file does not match expected hash. Expected: ${TypedArrayEncoder.toBase58(
                        options.verifyHash.hash
                    )}, Actual: ${TypedArrayEncoder.toBase58(fileHashBuffer)}`
                );
            }
        }
    }
}
