import { SmartAccount, type AAOptions } from '@particle-network/aa';
import { chains } from '@particle-network/chains';
import { walletEntryPlugin, type WalletOption } from '@particle-network/wallet';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ConnectModal from '../components/connectModal';
import SignModal from '../components/signModal';
import { type BaseConnector } from '../connector/base';
import { AASignerProvider } from '../evmSigner';
import useModalStateValue from '../hooks/useModalStateValue';
import { EventName } from '../types/eventName';
import { getBTCAAAddress } from '../utils/ethereumUtils';
import events from '../utils/eventUtils';
import txConfirm from '../utils/txConfirmUtils';

export type BtcVersion = '1.0.0' | '2.0.0';
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
  btcVersion: BtcVersion;
}

const ConnectContext = createContext<GlobalState>({} as any);

interface ConnectOptions {
  projectId: string;
  clientKey: string;
  appId: string;
  aaOptions: AAOptions;
  btcVersion?: BtcVersion;
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
  const {
    closeModal: closeConnectModal,
    isModalOpen: connectModalOpen,
    openModal: openConnectModal,
  } = useModalStateValue();

  const { closeModal: closeSignModal, isModalOpen: signModalOpen, openModal: openSignModal } = useModalStateValue();

  const [connectorId, setConnectorId] = useState<string>();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [evmAccount, setEVMAccount] = useState<string>();

  const [btcVersion, setBtcVersion] = useState<BtcVersion>(options.btcVersion || '1.0.0');

  useEffect(() => {
    const id = localStorage.getItem('current-connector-id');
    if (autoConnect && id) {
      setConnectorId(id);
    }
  }, [autoConnect]);

  const evmSupportChainIds = useMemo(() => {
    let chainIds = options.aaOptions.accountContracts['BTC']
      .filter((item) => item.version === btcVersion)
      .map((item) => item.chainIds)
      .reduce((a, b) => {
        a.push(...b);
        return a;
      }, []);
    chainIds = Array.from(new Set(chainIds));
    return chainIds;
  }, [options.aaOptions.accountContracts, btcVersion]);

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

    if (
      !(window as any).__bitcoinSmartAccount ||
      ((window as any)?.__bitcoinSmartAccount &&
        (window as any)?.__bitcoinSmartAccount.smartAccountContract.version !== btcVersion)
    ) {
      const smartAccount = new SmartAccount(
        new AASignerProvider(evmSupportChainIds, options.projectId, options.clientKey) as any,
        options
      );
      smartAccount.setSmartAccountContract({
        name: 'BTC',
        version: btcVersion,
      });
      (window as any).__bitcoinSmartAccount = smartAccount;
    }
    (window as any).__bitcoinSmartAccount.provider.getPublicKey = getPublicKey;
    (window as any).__bitcoinSmartAccount.provider.personalSign = signMessage;
    return (window as any).__bitcoinSmartAccount as SmartAccount;
  }, [options, evmSupportChainIds, getPublicKey, signMessage, btcVersion]);

  useEffect(() => {
    if (accounts.length > 0 && smartAccount) {
      getBTCAAAddress(smartAccount, accounts[0], btcVersion)
        .then((res) => {
          setEVMAccount(res);
        })
        .catch((e) => {
          setEVMAccount(undefined);
          console.error('smartAccount getAddress error', e);
          // ignore
        });
    } else {
      setEVMAccount(undefined);
    }
  }, [accounts, smartAccount, getPublicKey, btcVersion]);

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
    txConfirm.reset();
    if (connector) {
      connector.disconnect();
    }
    setConnectorId(undefined);
  }, [connector]);

  useEffect(() => {
    setBtcVersion(options.btcVersion || '1.0.0');
  }, [options.btcVersion]);

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
          version: btcVersion,
        },
        customStyle: {
          ...options.walletOptions?.customStyle,
          supportChains: supportChains as any,
          evmSupportWalletConnect: false,
        },
      }
    );
    console.log('walletEntryPlugin init');
  }, [options, evmSupportChainIds, btcVersion]);

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

  useEffect(() => {
    if (accounts.length === 0) {
      closeConnectModal();
      closeSignModal();
      if (events.listenerCount(EventName.sendUserOpResult) > 0) {
        events.emit(EventName.sendUserOpResult, {
          error: {
            code: -32600,
            message: 'Wallet disconnected',
          },
        });
      }
    }
  }, [accounts, closeConnectModal, closeSignModal]);

  return (
    <ConnectContext.Provider
      value={{
        connectorId,
        setConnectorId,
        connector,
        connectors,
        openConnectModal,
        closeConnectModal,
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
        btcVersion,
      }}
    >
      {children}
      <ConnectModal open={connectModalOpen} onClose={closeConnectModal} />
      <SignModal open={signModalOpen} onClose={closeSignModal} onOpen={openSignModal} />
    </ConnectContext.Provider>
  );
};

export const useConnectProvider = () => {
  const context = useContext(ConnectContext);
  return context;
};

export const useBtcVersion = () => {
  const context = useContext(ConnectContext);
  return {
    btcVersion: context.btcVersion,
  };
};
