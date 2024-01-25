import { intToHex } from '@ethereumjs/util';
import { SmartAccount, type AAOptions } from '@particle-network/aa';
import { chains } from '@particle-network/chains';
import { walletEntryPlugin, type WalletOption } from '@particle-network/wallet';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ConnectModal from '../components/connectModal';
import { type BaseConnector } from '../connector/base';
import { AASignerProvider } from '../evmSigner';

interface GlobalState {
  connectorId?: string;
  setConnectorId: (connectorId?: string) => void;
  connector?: BaseConnector;
  connectors: BaseConnector[];
  openConnectModal: () => void;
  closeConnectModal: () => void;
  accounts: string[];
  provider: any;
  disconnect: () => void;
  getPublicKey: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  evmAccount?: string;
  smartAccount?: SmartAccount;
  switchNetwork: (network: 'livenet' | 'testnet') => Promise<void>;
  getNetwork: () => Promise<'livenet' | 'testnet'>;
  sendBitcoin: (toAddress: string, satoshis: number, options?: { feeRate: number }) => Promise<string>;
}

const ConnectContext = createContext<GlobalState>({} as any);

interface ConnectOptions {
  projectId: string;
  clientKey: string;
  appId: string;
  aaOptions: AAOptions;
  walletOptions?: Omit<WalletOption, 'erc4337' | 'customStyle'> & {
    customStyle?: Omit<WalletOption['customStyle'], 'supportChains' | 'evmSupportWalletConnect'>;
  };
}

export const ConnectProvider = ({
  children,
  options,
  connectors,
  autoConnect = true,
}: {
  children: React.ReactNode;
  options: ConnectOptions;
  connectors: BaseConnector[];
  autoConnect?: boolean;
}) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [connectorId, setConnectorId] = useState<string>();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [evmAccount, setEVMAccount] = useState<string>();

  useEffect(() => {
    const id = localStorage.getItem('current-connector-id');
    if (autoConnect && id) {
      setConnectorId(id);
    }
  }, [autoConnect]);

  const evmSupportChainIds = useMemo(() => {
    let chainIds = options.aaOptions.accountContracts['BTC']
      .map((item) => item.chainIds)
      .reduce((a, b) => {
        a.push(...b);
        return a;
      }, []);
    chainIds = Array.from(new Set(chainIds));
    return chainIds;
  }, [options.aaOptions.accountContracts]);

  const connector = useMemo(() => {
    return connectors.find((item) => item.metadata.id === connectorId);
  }, [connectorId, connectors]);

  const getPublicKey = useCallback(async () => {
    if (!connector) {
      throw new Error('Wallet not connected!');
    }
    const pubKey = await connector.getPublicKey();
    return pubKey;
  }, [connector]);

  const signMessage = useCallback(
    async (message: string) => {
      if (!connector) {
        throw new Error('Wallet not connected!');
      }
      const signature = await connector.signMessage(message);
      return signature;
    },
    [connector]
  );

  const sendBitcoin = useCallback(
    async (toAddress: string, satoshis: number, options?: { feeRate: number }) => {
      if (!connector) {
        throw new Error('Wallet not connected!');
      }

      const signature = await connector.sendBitcoin(toAddress, satoshis, options);
      return signature;
    },
    [connector]
  );

  const getNetwork = useCallback(async () => {
    if (!connector) {
      throw new Error('Wallet not connected!');
    }
    const network = await connector.getNetwork();
    return network;
  }, [connector]);

  const switchNetwork = useCallback(
    async (network: 'livenet' | 'testnet') => {
      if (!connector) {
        throw new Error('Wallet not connected!');
      }
      await connector.switchNetwork(network);
    },
    [connector]
  );

  const smartAccount = useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!(window as any).__bitcoinSmartAccount) {
      const smartAccount = new SmartAccount(
        new AASignerProvider(evmSupportChainIds, options.projectId, options.clientKey) as any,
        options
      );
      smartAccount.setSmartAccountContract({
        name: 'BTC',
        version: '1.0.0',
      });
      (window as any).__bitcoinSmartAccount = smartAccount;
    }
    (window as any).__bitcoinSmartAccount.provider.getPublicKey = getPublicKey;
    (window as any).__bitcoinSmartAccount.provider.personalSign = signMessage;
    return (window as any).__bitcoinSmartAccount as SmartAccount;
  }, [options, evmSupportChainIds, getPublicKey, signMessage]);

  useEffect(() => {
    if (accounts.length > 0 && smartAccount) {
      smartAccount
        .getAddress()
        .then((res) => setEVMAccount(res))
        .catch((e) => {
          setEVMAccount(undefined);
          console.error('smartAccount getAddress error', e);
          // ignore
        });
    } else {
      setEVMAccount(undefined);
    }
  }, [accounts, smartAccount]);

  const requestAccount = useCallback(
    async (connector: BaseConnector) => {
      let accounts = await connector.getAccounts();
      console.log('requestAccount start, autoConnect', accounts, autoConnect);
      if (accounts.length === 0 && autoConnect) {
        accounts = await connector.requestAccounts();
      }
      setAccounts(accounts);
    },
    [autoConnect]
  );

  useEffect(() => {
    if (connector) {
      requestAccount(connector).catch((e: any) => {
        console.log('get account error', e);
        setAccounts([]);
      });
    } else {
      setAccounts([]);
    }
  }, [connector, requestAccount]);

  useEffect(() => {
    const onAccountChange = (accounts: string[]) => {
      setAccounts(accounts);
    };
    connector?.on('accountsChanged', onAccountChange as any);
    return () => {
      connector?.removeListener('accountsChanged', onAccountChange as any);
    };
  }, [connector]);

  const provider = useMemo(() => {
    if (connectorId) {
      return connectors.find((item) => item.metadata.id === connectorId)?.getProvider();
    }
  }, [connectorId, connectors]);

  const disconnect = useCallback(() => {
    localStorage.removeItem('current-connector-id');
    if (connector) {
      connector.disconnect();
    }
    setConnectorId(undefined);
  }, [connector]);

  useEffect(() => {
    const supportChains = evmSupportChainIds.map((id) => chains.getEVMChainInfoById(id));
    if (supportChains.some((chain) => !chain)) {
      throw new Error(`Please config valid chain ids, ${JSON.stringify(evmSupportChainIds)}`);
    }
    walletEntryPlugin.init(
      {
        projectId: options.projectId,
        clientKey: options.clientKey,
        appId: options.appId,
      },
      {
        ...options.walletOptions,
        erc4337: {
          name: 'BTC',
          version: '1.0.0',
        },
        customStyle: {
          ...options.walletOptions?.customStyle,
          supportChains: supportChains as any,
          evmSupportWalletConnect: false,
        },
      }
    );
    console.log('walletEntryPlugin init');
  }, [options, evmSupportChainIds]);

  useEffect(() => {
    if (smartAccount) {
      walletEntryPlugin.setWalletCore({
        ethereum: smartAccount.provider,
      });
      console.log('walletEntryPlugin setWalletCore');
    }
  }, [smartAccount, options, evmSupportChainIds]);

  useEffect(() => {
    if (evmAccount) {
      walletEntryPlugin.walletEntryCreate();
      console.log('walletEntryPlugin walletEntryCreate');
    } else {
      walletEntryPlugin.walletEntryDestroy();
      console.log('walletEntryPlugin walletEntryDestroy');
    }
  }, [evmAccount, smartAccount, options, evmSupportChainIds]);

  return (
    <ConnectContext.Provider
      value={{
        connectorId,
        setConnectorId,
        connector,
        connectors,
        openConnectModal: () => setOpenModal(true),
        closeConnectModal: () => setOpenModal(false),
        accounts,
        provider,
        disconnect,
        getPublicKey,
        signMessage,
        evmAccount,
        smartAccount,
        getNetwork,
        switchNetwork,
        sendBitcoin,
      }}
    >
      {children}
      {openModal && <ConnectModal connectors={connectors} />}
    </ConnectContext.Provider>
  );
};

export const useConnectProvider = () => {
  const context = useContext(ConnectContext);
  return context;
};

export const useConnectModal = () => {
  const { openConnectModal, disconnect } = useConnectProvider();
  return { openConnectModal, disconnect };
};

export const useAccounts = () => {
  const { accounts } = useConnectProvider();
  return { accounts };
};

export const useConnector = () => {
  const { connectors, setConnectorId } = useConnectProvider();

  const connect = useCallback(
    async (connectorId: string) => {
      const connector = connectors.find((item) => item.metadata.id === connectorId);
      if (!connector) {
        throw new Error(`connector id ${connectorId} not found`);
      }
      const accounts = await connector.requestAccounts();
      if (accounts.length > 0) {
        localStorage.setItem('current-connector-id', connector.metadata.id);
        setConnectorId(connector.metadata.id);
      }
    },
    [connectors, setConnectorId]
  );

  return { connectors, connect };
};

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

export const useETHProvider = () => {
  const { evmAccount, smartAccount } = useConnectProvider();
  const [chainId, setChainId] = useState<number>();

  useEffect(() => {
    if (smartAccount) {
      const chainId = (smartAccount.provider as any).chainId as number;
      setChainId(chainId);

      const onChangeChange = (id: string) => {
        setChainId(Number(id));
      };
      smartAccount.provider.on('chainChanged', onChangeChange);
      return () => {
        smartAccount.provider.removeListener('chainChanged', onChangeChange);
      };
    }
  }, [smartAccount]);

  const switchChain = useCallback(
    async (chainId: number) => {
      if (smartAccount?.provider) {
        await smartAccount.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [
            {
              chainId: intToHex(chainId),
            },
          ],
        });
      }
    },
    [smartAccount?.provider]
  );

  return {
    evmAccount,
    smartAccount,
    switchChain,
    chainId,
  };
};
