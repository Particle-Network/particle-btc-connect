import icon from '../icons/bitget.png';
import { type WalletMetadata } from './base';
import { InjectedConnector } from './injected';

export class BitgetConnector extends InjectedConnector {
  readonly metadata: WalletMetadata = {
    id: 'bitget',
    name: 'Bitget Wallet',
    icon,
    downloadUrl: 'https://web3.bitget.com/en/wallet-download',
  };

  constructor() {
    super('bitkeep.unisat');
  }
}
