import type { IEthereumProvider, JsonRpcRequest, SendTransactionParams } from '@particle-network/aa';
import { type AASignerProvider } from '.';

export class EthereumProvider implements IEthereumProvider {
  constructor(
    public sendUserOp: (params: SendTransactionParams, forceHideConfirmModal?: boolean) => Promise<string>,
    public signer?: AASignerProvider,
    public account?: string
  ) {}

  on(event: string, listener: any): this {
    this.signer?.on(event, listener);
    return this;
  }

  once(event: string, listener: any): this {
    this.signer?.once(event, listener);
    return this;
  }

  off(event: string, listener: any): this {
    this.signer?.off(event, listener);
    return this;
  }

  removeListener(event: string, listener: any): this {
    this.signer?.removeListener(event, listener);
    return this;
  }

  async request(arg: Partial<JsonRpcRequest>): Promise<any> {
    const method = arg.method;
    if (!method) {
      throw new Error('Method not found.');
    }

    if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
      return this.account ? [this.account] : [];
    } else if (method === 'eth_sendTransaction') {
      const txData = arg.params?.[0];
      const result = await this.sendUserOp({ tx: txData });
      return result;
    }

    return this.signer?.request(arg as any);
  }
}
