import { BaseConnector } from './base';

export abstract class InjectedConnector extends BaseConnector {
  constructor(private propertity: string) {
    super();
    const props = this.propertity?.split('.');
    if (!this.propertity || props.length > 2) {
      throw new Error('please input valid propertity');
    }
  }
  isReady(): boolean {
    if (typeof window !== 'undefined') {
      const props = this.propertity.split('.');
      if (props.length === 1) {
        return typeof (window as any)[props[0]] !== 'undefined';
      } else {
        return (
          typeof (window as any)[props[0]] !== 'undefined' && typeof (window as any)[props[0]][props[1]] !== 'undefined'
        );
      }
    }
    return false;
  }

  async requestAccounts(): Promise<string[]> {
    const accounts = await this.getProviderOrThrow().requestAccounts();
    console.log('🚀 ~ InjectedConnector ~ requestAccounts ~ accounts:', accounts);
    return accounts;
  }

  async getAccounts(): Promise<string[]> {
    const accounts = await this.getProviderOrThrow().getAccounts();
    return accounts;
  }
  async getPublicKey(): Promise<string> {
    return this.getProviderOrThrow().getPublicKey();
  }
  async signMessage(signStr: string, type?: 'ecdsa' | 'bip322-simple'): Promise<string> {
    const addresses = await this.getAccounts();
    if (addresses.length === 0) {
      throw new Error(`${this.metadata.name} not connected!`);
    }
    return this.getProviderOrThrow().signMessage(signStr, type);
  }
  on(event: string, handler: (data?: unknown) => void) {
    const provider = this.getProvider();
    return provider?.on?.(event, handler);
  }
  removeListener(event: string, handler: (data?: unknown) => void) {
    const provider = this.getProvider();
    return provider?.removeListener?.(event, handler);
  }

  getProvider() {
    if (this.isReady()) {
      const props = this.propertity.split('.');
      if (props.length === 1) {
        return (window as any)[props[0]];
      } else {
        return (window as any)[props[0]][props[1]];
      }
    }
  }

  getProviderOrThrow() {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error(`${this.metadata.name} is not install or not create Bitcoin wallet!`);
    }
    return provider;
  }

  async getNetwork(): Promise<'livenet' | 'testnet'> {
    return this.getProviderOrThrow().getNetwork();
  }
  async switchNetwork(network: 'livenet' | 'testnet'): Promise<void> {
    return this.getProviderOrThrow().switchNetwork(network);
  }

  async sendBitcoin(toAddress: string, satoshis: number, options?: { feeRate: number }): Promise<string> {
    return this.getProviderOrThrow().sendBitcoin(toAddress, satoshis, options);
  }

  async sendInscription(
    address: string,
    inscriptionId: string,
    options?: { feeRate: number }
  ): Promise<{ txid: string }> {
    const result = await this.getProviderOrThrow().sendInscription(address, inscriptionId, options);
    if (typeof result === 'string') {
      return {
        txid: result,
      };
    }

    return result;
  }

  disconnect() {}
}
