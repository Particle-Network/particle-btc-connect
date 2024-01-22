export * from './connector';
export { ConnectProvider, useAccounts, useBTCProvider, useConnectModal, useConnector, useETHProvider } from './context';

export const getVersion = () => {
  return '__buildVersion';
};
