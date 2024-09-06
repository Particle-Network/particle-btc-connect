import icon from '../icons/tomo.png';
import { type WalletMetadata } from './base';
import { InjectedConnector } from './injected';

export class TomoConnector extends InjectedConnector {
  readonly metadata: WalletMetadata = {
    id: 'tomo',
    name: 'TOMO Wallet',
    icon,
    downloadUrl: 'https://tomo.inc/',
  };
  constructor() {
    super('tomo_btc');
  }
}
