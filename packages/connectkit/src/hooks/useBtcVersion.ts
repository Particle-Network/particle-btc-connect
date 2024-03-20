import { useConnectProvider } from '../context';

export const useBtcVersion = () => {
  const { btcVersionList, btcVersion, setBtcVersion } = useConnectProvider();
  return {
    btcVersionList,
    btcVersion,
    setBtcVersion,
  };
};
