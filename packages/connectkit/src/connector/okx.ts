import icon from '../icons/okx.svg';
import { type WalletMetadata } from './base';
import { InjectedConnector } from './injected';

export class OKXConnector extends InjectedConnector {
  readonly metadata: WalletMetadata = {
    id: 'okx',
    name: 'OKX Wallet',
    icon,
  };
  constructor() {
    super('okxwallet.bitcoin');
  }
}
