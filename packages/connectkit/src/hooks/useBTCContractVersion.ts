import { useConnectProvider } from '../context';

export const useBTCContractVersion = () => {
  const { btcContractVersionList, btcContractVersion, setBTCContractVersion } = useConnectProvider();
  return {
    btcContractVersionList,
    btcContractVersion,
    setBTCContractVersion,
  };
};
