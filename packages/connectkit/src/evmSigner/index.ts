import { intToHex } from '@ethereumjs/util';
import type { RequestArguments } from '@particle-network/aa';
import { EventEmitter } from 'events';
import {
  InvalidParamsRpcError,
  SwitchChainError,
  UnsupportedProviderMethodError,
  createPublicClient,
  http,
  type PublicClient,
} from 'viem';
import { convertSignature, pubKeyToEVMAddress } from '../utils/ethereumUtils';

export class AASignerProvider {
  private events: EventEmitter;
  chainId = 1;
  publicClient: PublicClient;
  constructor(
    public supportChainIds: number[],
    public projectId: string,
    public clientKey: string
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(100);

    if (typeof window !== 'undefined') {
      const localChainId = localStorage.getItem('connect-evm-chain-id');
      if (localChainId && supportChainIds.includes(Number(localChainId))) {
        this.chainId = Number(localChainId);
      } else {
        const chainId = supportChainIds[0];
        if (!chainId) {
          throw new Error('Please config valid chain id.');
        }
        localStorage.setItem('connect-evm-chain-id', chainId.toString());
        this.chainId = chainId;
      }
    }

    this.publicClient = this.getPublicClient();
  }

  async request(arg: RequestArguments) {
    if (
      arg.method === 'eth_sendTransaction' ||
      arg.method === 'wallet_addEthereumChain' ||
      arg.method === 'wallet_watchAsset' ||
      arg.method === 'eth_sign' ||
      arg.method.startsWith('eth_signTypedData')
    ) {
      throw new UnsupportedProviderMethodError(new Error('The Provider does not support the requested method.'));
    }

    if (arg.method === 'eth_accounts' || arg.method === 'eth_requestAccounts') {
      const pubKey = await this.getPublicKey();
      const address = pubKeyToEVMAddress(pubKey);
      return [address];
    } else if (arg.method === 'eth_chainId') {
      return `0x${this.chainId.toString(16)}`;
    } else if (arg.method === 'personal_sign') {
      const message = arg.params?.[0];
      const result = await this.personalSign(message || '');
      const convertResult = convertSignature(result);
      if (!convertResult) {
        throw new Error('sign error');
      }
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

  emit(event: string, ...args: any[]) {
    this.events.emit(event, args);
  }

  getPublicClient = () => {
    let rpcDomain = 'https://rpc.particle.network';
    if (typeof window !== 'undefined' && (window as any).__PARTICLE_ENVIRONMENT__ === 'development') {
      rpcDomain = 'https://rpc-debug.particle.network';
    }
    return createPublicClient({
      transport: http(
        `${rpcDomain}/evm-chain?chainId=${this.chainId}&projectUuid=${this.projectId}&projectKey=${this.clientKey}`
      ),
    });
  };
}
