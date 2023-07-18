import type { BrowserWalletModuleConfigOptions } from './BrowserWalletModuleConfig'
import { DependencyManager, Module, WalletApi, WalletModule } from '@aries-framework/core'

import { AriesFrameworkError, InjectionSymbols } from '@aries-framework/core'

import { BrowserWalletModuleConfig } from './BrowserWalletModuleConfig'
// import { InMemoryStorageService } from './BrowserStorageService'
import { BrowserWallet } from './BrowserWallet'
import { IndexedDBStorageService } from './IndexedDBStorageService'
import { InMemoryStorageService } from './BrowserStorageService'

export class BrowserWalletModule implements WalletModule {
    public readonly config: BrowserWalletModuleConfig
    public readonly api = WalletApi

    public constructor(config: BrowserWalletModuleConfigOptions) {
        this.config = new BrowserWalletModuleConfig(config)
    }

    public register(dependencyManager: DependencyManager) {
        dependencyManager.registerInstance(BrowserWalletModuleConfig, this.config)

        if (dependencyManager.isRegistered(InjectionSymbols.Wallet)) {
            throw new AriesFrameworkError('There is an instance of Wallet already registered')
        } else {
            dependencyManager.registerContextScoped(InjectionSymbols.Wallet, BrowserWallet)
        }

        if (dependencyManager.isRegistered(InjectionSymbols.StorageService)) {
            throw new AriesFrameworkError('There is an instance of StorageService already registered')
        } else {
            dependencyManager.registerSingleton(InjectionSymbols.StorageService, IndexedDBStorageService)
        }
    }
}
