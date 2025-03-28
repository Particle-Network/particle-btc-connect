import icon from '../icons/gate.png';
import { type WalletMetadata } from './base';
import { InjectedConnector } from './injected';

export class GateConnector extends InjectedConnector {
  readonly metadata: WalletMetadata = {
    id: 'gate',
    name: 'Gate Wallet',
    icon,
    downloadUrl: 'https://www.gate.io/web3',
  };
  constructor() {
    super('gatewallet.btc');
  }
}
