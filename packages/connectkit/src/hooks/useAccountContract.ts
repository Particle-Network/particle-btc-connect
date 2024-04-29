import { useConnectProvider } from '../context';

export const useAccountContract = () => {
  const { accountContract, setAccountContract } = useConnectProvider();
  return {
    accountContract,
    setAccountContract,
  };
};
