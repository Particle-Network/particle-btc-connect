import { intToHex } from '@ethereumjs/util';
import type { RequestArguments } from '@particle-network/aa';
import { chains } from '@particle-network/chains';
import { EventEmitter } from 'events';
import {
  InvalidParamsRpcError,
  SwitchChainError,
  UnsupportedProviderMethodError,
  createPublicClient,
  hashMessage,
  hashTypedData,
  http,
  type PublicClient,
} from 'viem';
import { EVMMethod } from '../types/evmMethod';
import { convertSignature, pubKeyToEVMAddress } from '../utils/ethereumUtils';

export class AASignerProvider {
  private events: EventEmitter;
  chainId = 1;
  publicClient: PublicClient;
  constructor(
    public supportChainIds: number[],
    public projectId: string,
    public clientKey: string,
    public rpcUrls: Record<number, string> | undefined
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(100);

    if (typeof window !== 'undefined') {
      const localChainId = localStorage.getItem('connect-evm-chain-id');
      if (localChainId && supportChainIds.includes(Number(localChainId))) {
        this.chainId = Number(localChainId);
      } else {
        const chainId = supportChainIds[0];
        if (chainId) {
          localStorage.setItem('connect-evm-chain-id', chainId.toString());
          this.chainId = chainId;
        }
      }
    }

    this.publicClient = this.getPublicClient();
  }

  async request(arg: RequestArguments) {
    if (
      arg.method === 'eth_sendTransaction' ||
      arg.method === 'wallet_addEthereumChain' ||
      arg.method === 'wallet_watchAsset' ||
      arg.method === 'eth_sign'
    ) {
      throw new UnsupportedProviderMethodError(new Error('The Provider does not support the requested method.'));
    }

    if (arg.method === 'eth_accounts' || arg.method === 'eth_requestAccounts') {
      const pubKey = await this.getPublicKey();
      const address = pubKeyToEVMAddress(pubKey);
      return [address];
    } else if (arg.method === 'eth_chainId') {
      return `0x${this.chainId.toString(16)}`;
    } else if (arg.method === EVMMethod.personalSign) {
      let message = arg.params?.[0];
      console.log('personal_sign message:', message);
      if (message.length !== 66) {
        const hash = hashMessage({ raw: message });
        console.log('personal_sign hash:', hash);
        message = hash;
      }
      const result = await this.personalSign(message || '');
      const convertResult = convertSignature(result);
      if (!convertResult) {
        throw new Error('sign error');
      }
      console.log(`personal_sign result(${convertResult.length}): `, convertResult);
      return convertResult;
    } else if (arg.method === 'eth_signTypedData' || arg.method === 'eth_signTypedData_v4') {
      const typedData = arg.params?.[1];
      console.log('signTypedData typedData', typedData);
      const hash = hashTypedData(typeof typedData === 'string' ? JSON.parse(typedData) : typedData);
      console.log('signTypedData hash', hash);
      const result = await this.personalSign(hash || '');
      const convertResult = convertSignature(result);
      if (!convertResult) {
        throw new Error('sign error');
      }
      console.log(`eth_signTypedData result(${convertResult.length}): `, convertResult);
      return convertResult;
    } else if (arg.method === 'wallet_switchEthereumChain') {
      if (arg.params && arg.params instanceof Array && arg.params[0] && arg.params[0].chainId) {
        const chainId = Number(arg.params[0].chainId);
        if (this.supportChainIds.includes(this.chainId)) {
          this.chainId = chainId;
          localStorage.setItem('connect-evm-chain-id', this.chainId.toString());
          this.publicClient = this.getPublicClient();
          setTimeout(() => this.events.emit('chainChanged', intToHex(this.chainId)), 0);
          return Promise.resolve(null);
        }
        throw new SwitchChainError(new Error(`The chain: ${chainId} is not supported`));
      } else {
        throw new InvalidParamsRpcError(new Error('Invalid Params'));
      }
    } else {
      const result = await this.publicClient.request(arg as any);
      return result;
    }
  }

  personalSign = async (message: string): Promise<string> => {
    throw new Error('Wallet not connected!');
  };

  getPublicKey = async (): Promise<string> => {
    throw new Error('Wallet not connected!');
  };

  removeListener(event: string, listener: (...args: any[]) => void) {
    this.events.removeListener(event, listener);
    return this;
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.events.on(event, listener);
    return this;
  }

  once(event: string, listener: any) {
    this.events.once(event, listener);
    return this;
  }

  off(event: string, listener: any) {
    this.events.off(event, listener);
    return this;
  }

  emit(event: string, ...args: any[]) {
    this.events.emit(event, args);
  }

  getPublicClient = () => {
    const rpcUrl = this?.rpcUrls?.[this.chainId] || chains.getEVMChainInfoById(this.chainId || 1)?.rpcUrl;
    console.log('rpcUrl', rpcUrl);

    return createPublicClient({
      transport: http(rpcUrl),
    });
  };
}
