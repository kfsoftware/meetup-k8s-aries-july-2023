// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BrowserWalletModuleConfigOptions { }

/**
 * @public
 */
export class BrowserWalletModuleConfig {
    private options: BrowserWalletModuleConfigOptions

    public constructor(options: BrowserWalletModuleConfigOptions) {
        this.options = options
    }
}
