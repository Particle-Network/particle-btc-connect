import { useConnectProvider } from '../context';

export const useBTCContractVersion = () => {
  const { contractVersionList, contractVersion, setBTCContractVersion, accountContractKey } =
    useConnectProvider();
  return {
    accountContractKey,
    contractVersionList,
    contractVersion,
    setBTCContractVersion,
  };
};
