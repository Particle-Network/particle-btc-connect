import { SmartAccount, type IEthereumProvider } from '@particle-network/aa';
import { PolygonMumbai } from '@particle-network/chains';
import { create } from 'zustand';

export type BtcVersion = '1.0.0' | '2.0.0';

type State = {
  smartAccount: SmartAccount | undefined;
  btcVersion: BtcVersion;
};

type Actions = {
  setProvider: (provider: IEthereumProvider) => void;
  setBtcVersion: (version: BtcVersion) => void;
};

const useSmartAccount = create<State & Actions>((set) => ({
  smartAccount: undefined,
  btcVersion: '1.0.0',
  setBtcVersion: (version: BtcVersion) => set({ btcVersion: version }),
  setProvider: (provider: IEthereumProvider) =>
    set((state) => {
      if (!state.smartAccount) {
        const smartAccount = new SmartAccount(provider, {
          projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
          clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY as string,
          appId: process.env.NEXT_PUBLIC_APP_ID as string,
          aaOptions: {
            accountContracts: {
              BICONOMY: [
                {
                  version: '2.0.0',
                  chainIds: [PolygonMumbai.id],
                },
              ],
            },
          },
        });

        return { smartAccount };
      }
      const smartAccount = state.smartAccount;
      smartAccount.provider = provider;
      return { smartAccount };
    }),
}));

export default useSmartAccount;
