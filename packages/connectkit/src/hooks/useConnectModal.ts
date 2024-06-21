import { useConnectProvider } from '../context';

export const useConnectModal = () => {
  //todo: return async connect status
  const { openConnectModal, disconnect } = useConnectProvider();
  return { openConnectModal, disconnect };
};
