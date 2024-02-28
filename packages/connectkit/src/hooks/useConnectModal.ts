import { useConnectProvider } from '../context';

export const useConnectModal = () => {
  const { openConnectModal, disconnect } = useConnectProvider();
  return { openConnectModal, disconnect };
};
