'use client';

import { accountContracts } from '@/config';
import {
  ConnectProvider as BTCConnectProvider,
  BitgetConnector,
  OKXConnector,
  TokenPocketConnector,
  UnisatConnector,
  WizzConnector,
} from '@particle-network/btc-connectkit';
import VConsole from 'vconsole';

if (typeof window !== 'undefined') {
  (window as any).__PARTICLE_ENVIRONMENT__ = process.env.NEXT_PUBLIC_PARTICLE_ENV;
  if (process.env.NEXT_PUBLIC_PARTICLE_ENV === 'development') {
    setTimeout(() => {
      new VConsole({ theme: 'dark' });
    }, 300);
  }
}

export default function ConnectProvider({ children }: { children: React.ReactNode }) {
  return (
    <BTCConnectProvider
      options={{
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
        clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY as string,
        appId: process.env.NEXT_PUBLIC_APP_ID as string,
        aaOptions: {
          accountContracts,
        },
        rpcUrls: {
          686868: 'https://testnet-rpc.merlinchain.io',
        },
      }}
      connectors={[
        new UnisatConnector(),
        new OKXConnector(),
        new BitgetConnector(),
        new TokenPocketConnector(),
        new WizzConnector(),
      ]}
    >
      {children}
    </BTCConnectProvider>
  );
}
