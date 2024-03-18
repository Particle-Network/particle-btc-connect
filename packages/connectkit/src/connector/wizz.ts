import icon from '../icons/wizz.svg';
import { type WalletMetadata } from './base';
import { InjectedConnector } from './injected';

export class WizzConnector extends InjectedConnector {
  readonly metadata: WalletMetadata = {
    id: 'wizz',
    name: 'Wizz Wallet',
    icon,
    downloadUrl: 'https://wizzwallet.io',
  };

  constructor() {
    super('wizz');
  }
}
