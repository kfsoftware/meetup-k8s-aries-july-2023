import {
    Buffer,
    InjectionSymbols,
    JsonEncoder,
    Jwk,
    Key,
    KeyType,
    SigningProviderRegistry,

    TypedArrayEncoder,
    WalletError,
    WalletExportPathExistsError,

    inject,
    injectable
} from '@aries-framework/core';
import { verify } from "@stablelib/ed25519";
import { DIDComm } from "encryption-envelope-js";
import sodium from 'libsodium-wrappers';
import { random, rc2, util } from "node-forge";

import type {
    EncryptedMessage,
    FileSystem,
    Logger,
    UnpackedMessageContext,
    Wallet,
    WalletConfig,
    WalletConfigRekey,
    WalletCreateKeyOptions,
    WalletExportImportConfig,
    WalletSignOptions,
    WalletVerifyOptions
} from '@aries-framework/core';


import { IDBPDatabase, openDB } from 'idb';

interface StorageKeyPair {
    // StorageKeyEncrypted in hex
    encrypted: string
    iv: string
    publicKey: string

}
interface ConfigKeyPair {
    key: string
    encrypted: string
    iv: string
}
interface StorageKeyEncrypted {
    publicKey58: string
    keyType: KeyType
    privateKey: string
}

interface ConfigKeyEncrypted {
    key: string
    value: string
}

interface StorageKey {
    privateKey: Uint8Array;
    key: Key;
}
class KeyPairStorageService {
    public dbPromise: Promise<IDBPDatabase>

    public constructor(private readonly walletConfig?: WalletConfig) {
        this.dbPromise = openDB(`wallet_${walletConfig.id}`, 1, {
            upgrade(db) {
                db.createObjectStore('keyPairs', { autoIncrement: false, keyPath: 'publicKey' });
                db.createObjectStore('config', { autoIncrement: false, keyPath: 'key' });
                db.createObjectStore('records', { autoIncrement: false, keyPath: 'id' });
            },
        })
    }

    public async ensureInitialized() {
        await this.dbPromise
        if (!await this.configKeyExists("profile_key")) {
            await this.saveConfig("profile_key", this.walletConfig!.key)
        } else {
            const config = await this.getConfig("profile_key")
            console.log("Config exists")
            // check if key is the same
        }
    }

    public async saveKeyPair(keyPair: Key, privateKey: Uint8Array): Promise<void> {
        const db = await this.dbPromise
        const tx = db.transaction('keyPairs', 'readwrite')
        const store = tx.objectStore('keyPairs')
        const storageKeyEncrypted: StorageKeyEncrypted = {
            publicKey58: keyPair.publicKeyBase58,
            keyType: keyPair.keyType,
            privateKey: TypedArrayEncoder.toBase64(privateKey)
        }
        const {
            encrypted,
            iv
        } = this.encryptData(Buffer.from(JSON.stringify(storageKeyEncrypted)))
        await store.put({
            encrypted: encrypted.toHex(),
            iv: iv,
            publicKey: keyPair.publicKeyBase58,
        } as StorageKeyPair)

        await tx.done
    }

    public async getKeyPair(publicKey: string): Promise<StorageKey | undefined> {
        console.log("publicKey", publicKey)
        const db = await this.dbPromise
        const tx = db.transaction('keyPairs', 'readonly')
        const store = tx.objectStore('keyPairs')

        const keyPair: StorageKeyPair | undefined = await store.get(publicKey)

        return keyPair ? this.mapKeyPairToKey(keyPair) : undefined
    }
    public async saveConfig(key: string, value: string): Promise<void> {
        const db = await this.dbPromise
        const tx = db.transaction('config', 'readwrite')
        const store = tx.objectStore('config')
        const storageKeyEncrypted: ConfigKeyEncrypted = {
            key: key,
            value: value
        }
        const {
            encrypted,
            iv
        } = this.encryptData(Buffer.from(JSON.stringify(storageKeyEncrypted)));
        await store.put({
            key: key,
            encrypted: encrypted.toHex(),
            iv: iv,
        } as ConfigKeyPair);

        await tx.done
    }
    public async getConfig(key: string): Promise<string | undefined> {
        const db = await this.dbPromise
        const tx = db.transaction('config', 'readonly')
        const store = tx.objectStore('config')

        const keyPair: ConfigKeyPair | undefined = await store.get(key)
        if (!keyPair) {
            return undefined
        }
        const decrypted = this.decryptData(keyPair.encrypted, keyPair.iv)
        const data = Buffer.from(decrypted.toHex(), "hex").toString("utf-8")
        const storageKeyEncrypted: ConfigKeyEncrypted = JSON.parse(data)
        return storageKeyEncrypted.value
    }
    public async configKeyExists(key: string): Promise<boolean> {
        const db = await this.dbPromise
        const tx = db.transaction('config', 'readonly')
        const store = tx.objectStore('config')

        const keyPair: StorageKeyPair | undefined = await store.get(key)

        return keyPair !== undefined
    }
    public async getSodiumKeyPair(publicKey: string): Promise<sodium.KeyPair | undefined> {
        const keyPair = await this.getKeyPair(publicKey)
        if (!keyPair) {
            return undefined
        }
        return {
            keyType: KeyType.Ed25519,
            privateKey: keyPair.privateKey,
            publicKey: keyPair.key.publicKey,
        }
    }
    public async getPrivateKey(publicKey: string): Promise<Uint8Array | undefined> {
        const db = await this.dbPromise
        const tx = db.transaction('keyPairs', 'readonly')
        const store = tx.objectStore('keyPairs')

        const keyPair: StorageKeyPair | undefined = await store.get(publicKey)
        if (!keyPair) {
            return undefined
        }
        const decrypted = this.decryptData(keyPair.encrypted, keyPair.iv)
        const data = Buffer.from(decrypted.toHex(), "hex").toString("utf-8")
        const storageKeyEncrypted: StorageKeyEncrypted = JSON.parse(data)
        return keyPair ? TypedArrayEncoder.fromBase64(storageKeyEncrypted.privateKey) : undefined
    }

    public async deleteKeyPair(key: Key): Promise<void> {
        const db = await this.dbPromise
        const tx = db.transaction('keyPairs', 'readwrite')
        const store = tx.objectStore('keyPairs')

        await store.delete(key.publicKeyBase58)
        await tx.done
    }

    public async getAllKeyPairs(): Promise<StorageKey[]> {
        const db = await this.dbPromise
        const tx = db.transaction('keyPairs', 'readonly')
        const store = tx.objectStore('keyPairs')

        const keyPairs: StorageKeyPair[] = await store.getAll()

        return keyPairs.map(this.mapKeyPairToKey)
    }
    private mapKeyPairToKey(keyPair: StorageKeyPair): StorageKey {
        console.log("KeyPair", keyPair)
        const decrypted = this.decryptData(keyPair.encrypted, keyPair.iv)
        const data = Buffer.from(decrypted.toHex(), "hex").toString("utf-8")
        const storageKeyEncrypted: StorageKeyEncrypted = JSON.parse(data)
        return {
            key: Key.fromPublicKeyBase58(storageKeyEncrypted.publicKey58, storageKeyEncrypted.keyType),
            privateKey: TypedArrayEncoder.fromBase64(storageKeyEncrypted.privateKey)
        }
    }
    private decryptData(encrypted: string, iv: string) {
        // decrypt some bytes
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        const cipher = rc2.createDecryptionCipher(this.walletConfig?.key!);
        cipher.start(iv);
        cipher.update(util.createBuffer(Buffer.from(encrypted, "hex")));
        cipher.finish();
        return cipher.output
    }
    private encryptData(data: Uint8Array) {
        const iv = random.getBytesSync(8);
        // encrypt some bytes
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        const cipher = rc2.createEncryptionCipher(this.walletConfig?.key!);
        cipher.start(iv);
        cipher.update(util.createBuffer(data));
        cipher.finish();
        const encrypted = cipher.output;

        return {
            iv: iv,
            encrypted: encrypted
        }
    }
}


@injectable()
export class BrowserWallet implements Wallet {
    supportedKeyTypes: KeyType[] = [KeyType.Ed25519]
    private walletConfig?: WalletConfig
    private fileSystem: FileSystem
    private logger: Logger;
    private signingKeyProviderRegistry: SigningProviderRegistry;
    private _store?: KeyPairStorageService;
    public constructor(
        @inject(InjectionSymbols.Logger) logger: Logger,
        @inject(InjectionSymbols.FileSystem) fileSystem: FileSystem,
        signingKeyProviderRegistry: SigningProviderRegistry
    ) {
        this.logger = logger
        this.fileSystem = fileSystem
        this.signingKeyProviderRegistry = signingKeyProviderRegistry
    }
    public get isProvisioned() {
        const isProvisioned = this.walletConfig !== undefined
        this.logger.info(`Invoked get isProvisioned() {`, { isProvisioned })
        return isProvisioned
    }
    public get isInitialized() {
        const isInitialized = this._store !== undefined
        this.logger.info(`Invoked get isInitialized() {`, { isInitialized })
        return isInitialized
    }
    public get store() {
        if (!this._store) {
            throw new WalletError("Wallet not initialized")
        }
        return this._store
    }
    async create(walletConfig: WalletConfig): Promise<void> {
        this.logger.info(`Invoked async create(walletConfig: WalletConfig): Promise<void> {`,)
    }
    async createAndOpen(walletConfig: WalletConfig): Promise<void> {
        this.logger.info(`Invoked async createAndOpen(walletConfig: WalletConfig): Promise<void> {`,)
        this.walletConfig = walletConfig
        this._store = new KeyPairStorageService(walletConfig)
        await this._store.ensureInitialized()
    }
    async open(walletConfig: WalletConfig): Promise<void> {
        this.logger.info(`Invoked async open(walletConfig: WalletConfig): Promise<void> {`, walletConfig)
        this.walletConfig = walletConfig
        this._store = new KeyPairStorageService(walletConfig)
        await this._store.ensureInitialized()
    }
    async rotateKey(walletConfig: WalletConfigRekey): Promise<void> {
        this.logger.info(`Invoked async rotateKey(walletConfig: WalletConfigRekey): Promise<void> {`,)
    }
    async close(): Promise<void> {
        this.logger.info(`Invoked async close(): Promise<void> {`,)
    }
    async delete(): Promise<void> {
        this.logger.info(`Invoked async delete(): Promise<void> {`,)
    }
    async export(exportConfig: WalletExportImportConfig): Promise<void> {
        this.logger.info(`Invoked async export(exportConfig: WalletExportImportConfig): Promise<void> {`, exportConfig)
        if (!this.walletConfig) {
            throw new WalletError(
                'Can not export wallet that does not have wallet config set. Make sure to open it before exporting'
            )
        }
        const sourcePath = `${this.fileSystem.dataPath}/${this.walletConfig.id}`
        const { path: destinationPath, key: exportKey } = exportConfig

        if (await this.fileSystem.exists(destinationPath)) {
            throw new WalletExportPathExistsError(
                `Unable to create export, wallet export at path '${exportConfig.path}' already exists`
            )
        }
        await this.fileSystem.copyFile(sourcePath, destinationPath)

    }
    async import(walletConfig: WalletConfig, importConfig: WalletExportImportConfig): Promise<void> {
        this.logger.info(`Invoked async import(walletConfig: WalletConfig, importConfig: WalletExportImportConfig): Promise<void> {`,)
    }

    async createKey(options: WalletCreateKeyOptions): Promise<Key> {
        const didComm = new DIDComm()
        await didComm.Ready
        const keyPair = await didComm.generateKeyPair()
        const key = Key.fromPublicKey(Buffer.from(keyPair.publicKey), options.keyType)
        this.logger.info("Created key", { publicKey: key.publicKeyBase58 })
        await this._store!.saveKeyPair(key, keyPair.privateKey)
        return key
    }

    async sign(options: WalletSignOptions): Promise<Buffer> {
        // const key = keys[options.key.publicKeyBase58]
        const key = await this._store!.getKeyPair(options.key.publicKeyBase58)
        if (!key) {
            throw new Error(`Unable to sign message, no private key found for key ${options.key.publicKeyBase58}`)
        }
        return Buffer.from(
            sodium.crypto_sign_detached(options.data as Buffer, key.privateKey, "uint8array")
        )
    }
    async verify(options: WalletVerifyOptions): Promise<boolean> {
        this.logger.info(`Invoked async verify(options: WalletVerifyOptions): Promise<boolean> {`, options)
        return verify(options.key.publicKey, options.data as Buffer, options.signature as Buffer)
    }
    async pack(payload: Record<string, unknown>, recipientKeys: string[], senderVerkey?: string | undefined): Promise<EncryptedMessage> {
        this.logger.info(`Invoked async pack(payload: Record<string, unknown>, recipientKeys: string[], senderVerkey?: string | undefined): Promise<EncryptedMessage> {`,
            {
                payload,
                recipientKeys,
                senderVerkey,
            }
        )
        // const key = keys[senderVerkey as string]
        const key = senderVerkey ? await this._store!.getSodiumKeyPair(senderVerkey as string) : undefined
        const didComm = new DIDComm()
        await didComm.Ready
        const message = await didComm.packMessage(
            JSON.stringify(payload),
            recipientKeys.map(k => {
                return Key.fromPublicKeyBase58(k, KeyType.Ed25519).publicKey
            }),
            key,
        )
        // const unpackedMessage = await didComm.unpackMessage(message, key)
        this.logger.info("message packed", { message })
        return JSON.parse(message) as EncryptedMessage
    }
    async unpack(encryptedMessage: EncryptedMessage): Promise<UnpackedMessageContext> {
        this.logger.info(`Invoked async unpack(encryptedMessage: EncryptedMessage): Promise<UnpackedMessageContext> {`, encryptedMessage)
        const didComm = new DIDComm()
        await didComm.Ready
        const protectedJson = JsonEncoder.fromBase64(encryptedMessage.protected)
        this.logger.info("protectedJson", protectedJson)
        for (const recip of protectedJson.recipients) {
            const kid = recip.header.kid
            if (!kid) {
                throw new WalletError('Blank recipient key')
            }
            const key = await this._store!.getKeyPair(kid)
            if (!key) {
                throw new WalletError(`Key not found for ${kid}`)
            }
            const unpackedMessage = await didComm.unpackMessage(
                JSON.stringify(encryptedMessage),
                {
                    keyType: KeyType.Ed25519,
                    privateKey: key.privateKey,
                    publicKey: key.key.publicKey,
                },
            )
            return {
                plaintextMessage: JSON.parse(unpackedMessage.message),
                senderKey: unpackedMessage.senderKey,
                recipientKey: unpackedMessage.recipientKey,
            }
        }
        return undefined as unknown as UnpackedMessageContext
    }
    async generateNonce(): Promise<string> {
        this.logger.info(`Invoked async generateNonce(): Promise<string> {`,)
        return "foo"
    }
    async generateWalletKey(): Promise<string> {
        this.logger.info(`Invoked async generateWalletKey(): Promise<string> {`,)
        return "walletKey"
    }
    dispose(): void | Promise<void> {
        this.logger.info(`Invoked dispose(): void | Promise<void> {`,)
    }

}
