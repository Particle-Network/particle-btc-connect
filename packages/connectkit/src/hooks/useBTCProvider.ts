import { useCallback } from 'react';
import { useConnectProvider } from '../context';

export const useBTCProvider = () => {
  const { connector, provider, accounts, getPublicKey, signMessage, getNetwork, switchNetwork, sendBitcoin } =
    useConnectProvider();

  const sendInscription = useCallback(
    async (address: string, inscriptionId: string, options?: { feeRate: number }) => {
      if (!connector) {
        throw new Error('Wallet not connected!');
      }
      const result = await connector.sendInscription(address, inscriptionId, options);
      return result;
    },
    [connector]
  );

  return { provider, accounts, getPublicKey, signMessage, getNetwork, switchNetwork, sendBitcoin, sendInscription };
};
