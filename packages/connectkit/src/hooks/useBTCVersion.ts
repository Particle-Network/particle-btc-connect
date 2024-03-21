import { useConnectProvider } from '../context';

export const useBTCVersion = () => {
  const { BTCVersionList, BTCVersion, setBTCVersion } = useConnectProvider();
  return {
    BTCVersionList,
    BTCVersion,
    setBTCVersion,
  };
};
