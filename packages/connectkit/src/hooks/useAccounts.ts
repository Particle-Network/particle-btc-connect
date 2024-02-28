import { useConnectProvider } from '../context';

export const useAccounts = () => {
  const { accounts } = useConnectProvider();
  return { accounts };
};
