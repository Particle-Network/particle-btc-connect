import type { Account } from '@particle-network/aa';

export type AccountInfo = Account & {
  name: 'BTC';
  btcPublicKey: string;
  btcAddress: string;
};
