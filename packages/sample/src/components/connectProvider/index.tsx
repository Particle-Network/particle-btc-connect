'use client';

import { accountContracts } from '@/config';
import {
  ConnectProvider as BTCConnectProvider,
  BitgetConnector,
  OKXConnector,
  UnisatConnector,
} from '@particle-network/btc-connectkit';

if (typeof window !== 'undefined') {
  (window as any).__PARTICLE_ENVIRONMENT__ = process.env.NEXT_PUBLIC_PARTICLE_ENV;
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
      }}
      connectors={[new UnisatConnector(), new OKXConnector(), new BitgetConnector()]}
    >
      {children}
    </BTCConnectProvider>
  );
}
