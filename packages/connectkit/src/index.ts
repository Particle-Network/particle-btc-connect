export * from './connector';
export { ConnectProvider, useAccounts, useBTCProvider, useConnectModal, useETHProvider } from './context';

export const getVersion = () => {
  return '__buildVersion';
};
