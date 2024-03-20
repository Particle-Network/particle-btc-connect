import { SmartAccount, type IEthereumProvider } from '@particle-network/aa';
import { PolygonMumbai } from '@particle-network/chains';
import { create } from 'zustand';

type State = {
  smartAccount: SmartAccount | undefined;
};

type Actions = {
  setProvider: (provider: IEthereumProvider) => void;
};

const useSmartAccount = create<State & Actions>((set) => ({
  smartAccount: undefined,
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
