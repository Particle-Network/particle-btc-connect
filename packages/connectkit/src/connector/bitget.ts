import icon from '../icons/bitget.png';
import { type WalletMetadata } from './base';
import { InjectedConnector } from './injected';

export class BitgetConnector extends InjectedConnector {
  readonly metadata: WalletMetadata = {
    id: 'bitget',
    name: 'Bitget Wallet',
    icon,
  };

  constructor() {
    super('bitkeep.unisat');
  }
}
