import type { IEthereumProvider, JsonRpcRequest } from '@particle-network/aa';
import { EventName } from '../types/eventName';
import { EVMMethod } from '../types/evmMethod';
import events, { getPendingSignEventAccount } from '../utils/eventUtils';
import txConfirm from '../utils/txConfirmUtils';

export class WalletClientProvider implements IEthereumProvider {
  constructor(private provider: IEthereumProvider) {}

  on(event: string, listener: any): this {
    this.provider.on(event, listener);
    return this;
  }

  once(event: string, listener: any): this {
    this.provider.once(event, listener);
    return this;
  }

  off(event: string, listener: any): this {
    this.provider.off(event, listener);
    return this;
  }

  removeListener(event: string, listener: any): this {
    this.provider.removeListener(event, listener);
    return this;
  }

  async request(arg: Partial<JsonRpcRequest>): Promise<any> {
    const method = arg.method;
    if (!method) {
      throw new Error('Method not found.');
    }

    if (method === EVMMethod.personalSign || method.startsWith(EVMMethod.signTypedData)) {
      const showConfirmModal = !txConfirm.isNotRemind();
      if (showConfirmModal) {
        if (getPendingSignEventAccount() > 0) {
          throw new Error('Operation failed, there is a transaction being processed');
        }
      }
      if (!showConfirmModal) {
        return this.provider.request(arg as any);
      }
    }

    if (method === EVMMethod.personalSign) {
      console.log('personal_sign ---- ', arg);
      return new Promise<string>((resolve, reject) => {
        events.emit(EventName.personalSign, arg);
        events.once(EventName.personalSignResult, ({ result, error }) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
      });
    } else if (method.startsWith(EVMMethod.signTypedData)) {
      return new Promise<string>((resolve, reject) => {
        events.emit(EventName.signTypedData, arg);
        events.once(EventName.signTypedDataResult, ({ result, error }) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
      });
    }

    return this.provider.request(arg as any);
  }
}
