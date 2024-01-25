export * from './connector';
export { ConnectProvider, useAccounts, useBTCProvider, useConnectModal, useConnector, useETHProvider } from './context';
export const getVersion = () => {
  return '__buildVersion';
};

if (typeof window !== 'undefined') {
  (window as any).__PARTICLE_BTC_CONNECT_VERSION = getVersion();
}
