import EventEmitter from 'events';
import type { Address, GetAddressOptions, SendBtcTransactionOptions, SignMessageOptions } from 'sats-connect';
import icon from '../icons/xverse.svg';
import { BaseConnector, type WalletMetadata } from './base';

export class XverseConnector extends BaseConnector {
  #network = 'Mainnet'; //Testnet
  #event = new EventEmitter();

  constructor() {
    super();
    this.#event.setMaxListeners(100);
  }

  readonly metadata: WalletMetadata = {
    id: 'xverse',
    name: 'Xverse Wallet',
    icon,
  };
  isReady(): boolean {
    return typeof window !== 'undefined' && typeof window.BitcoinProvider !== 'undefined';
  }

  private loadAccounts = async (network: 'Mainnet' | 'Testnet') => {
    const { getAddress, AddressPurpose } = await import('sats-connect');
    const addresses = await new Promise<Address[]>((resolve, reject) => {
      const getAddressOptions: GetAddressOptions = {
        payload: {
          purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
          message: 'Address for receiving Ordinals and payments',
          network: {
            type: network as any,
          },
        },
        onFinish: (response) => {
          resolve(response.addresses);
        },
        onCancel: () =>
          reject({
            code: 4001,
            message: 'User rejected the request.',
          }),
      };
      getAddress(getAddressOptions).catch((error) => reject(error));
    });
    localStorage.setItem('btc-connect-xverse-addresses-' + network, JSON.stringify(addresses));
    return addresses;
  };

  async requestAccounts(): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error(`${this.metadata.name} is not install!`);
    }
    const addresses = await this.loadAccounts(this.#network as any);
    return addresses.map((item) => item.address);
  }
  async getAccounts(): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error(`${this.metadata.name} is not install!`);
    }
    const data = localStorage.getItem('btc-connect-xverse-addresses-' + this.#network);
    if (data) {
      const addresses: Address[] = JSON.parse(data);
      return addresses.map((item) => item.address);
    } else {
      return [];
    }
  }
  async getPublicKey(): Promise<string> {
    if (!this.isReady()) {
      throw new Error(`${this.metadata.name} is not install!`);
    }
    const data = localStorage.getItem('btc-connect-xverse-addresses-' + this.#network);
    if (data) {
      const addresses: Address[] = JSON.parse(data);
      return addresses[0].publicKey;
    } else {
      return '';
    }
  }
  async signMessage(signStr: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error(`${this.metadata.name} is not install!`);
    }
    const addresses = await this.getAccounts();
    if (addresses.length === 0) {
      throw new Error(`${this.metadata.name} not connected!`);
    }

    const { signMessage } = await import('sats-connect');
    const sig = await new Promise<string>((resolve, reject) => {
      const signMessageOptions: SignMessageOptions = {
        payload: {
          network: {
            type: this.#network as any,
          },
          address: addresses[0],
          message: signStr,
        },
        onFinish: (response) => {
          resolve(response);
        },
        onCancel: () =>
          reject({
            code: 4001,
            message: 'User rejected the request.',
          }),
      };
      signMessage(signMessageOptions).catch((e) => reject(e));
    });
    return sig;
  }
  on(event: string, handler: (data?: unknown) => void) {
    return this.#event.on(event, handler);
  }
  removeListener(event: string, handler: (data?: unknown) => void) {
    return this.#event.removeListener(event, handler);
  }
  getProvider() {
    if (!this.isReady()) {
      throw new Error(`${this.metadata.name} is not install!`);
    }
    return window.BitcoinProvider;
  }
  async getNetwork(): Promise<'livenet' | 'testnet'> {
    if (!this.isReady()) {
      throw new Error(`${this.metadata.name} is not install!`);
    }
    return this.#network === 'Mainnet' ? 'livenet' : 'testnet';
  }
  async switchNetwork(network: 'livenet' | 'testnet'): Promise<void> {
    if (!this.isReady()) {
      throw new Error(`${this.metadata.name} is not install!`);
    }
    const changeTo = network === 'livenet' ? 'Mainnet' : 'Testnet';
    let addresses: Address[];
    const localData = localStorage.getItem('btc-connect-xverse-addresses-' + changeTo);
    if (localData) {
      addresses = JSON.parse(localData);
    } else {
      addresses = await this.loadAccounts(changeTo);
    }
    const accounts = addresses.map((item) => item.address);
    this.#event.emit('accountsChanged', accounts);
    this.#network = changeTo;
  }

  async sendBitcoin(toAddress: string, satoshis: number): Promise<string> {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error(`${this.metadata.name} is not install!`);
    }

    const { sendBtcTransaction } = await import('sats-connect');
    const addresses = await this.getAccounts();
    if (addresses.length === 0) {
      throw new Error(`${this.metadata.name} not connected!`);
    }

    const result = await new Promise<string>((resolve, reject) => {
      const sendBtcOptions: SendBtcTransactionOptions = {
        payload: {
          network: {
            type: this.#network as any,
          },
          recipients: [
            {
              address: toAddress,
              amountSats: BigInt(satoshis),
            },
          ],
          senderAddress: addresses[0],
        },
        onFinish: (response) => {
          resolve(response);
        },
        onCancel: () => {
          reject({
            code: 4001,
            message: 'User rejected the request.',
          });
        },
      };
      sendBtcTransaction(sendBtcOptions).catch((e) => reject(e));
    });
    return result;
  }
}
