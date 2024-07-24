import { useCallback, useMemo } from 'react';
import { useConnectProvider } from '../context';
import { EventName } from '../types/eventName';
import events from '../utils/eventUtils';
import { useAccounts } from './useAccounts';

export const useConnectModal = () => {
  const { openConnectModal: _openConnectModal, disconnect: _disconnect } = useConnectProvider();
  const { accounts } = useAccounts();

  const connect = useCallback(async (): Promise<readonly [string, ...string[]]> => {
    return new Promise((resolve, reject) => {
      const onConnectResult = ({ result, error }: any) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      };
      events.once(EventName.connectResult, onConnectResult);
      _openConnectModal();
    });
  }, [_openConnectModal]);

  const openConnectModalAsync = useMemo(() => {
    if (accounts.length > 0) {
      return undefined;
    } else {
      return connect;
    }
  }, [accounts, connect]);

  const disconnect = useMemo(() => {
    if (accounts.length > 0) {
      return _disconnect;
    } else {
      return undefined;
    }
  }, [accounts, _disconnect]);

  const openConnectModal = useMemo(() => {
    if (accounts.length > 0) {
      return undefined;
    } else {
      return _openConnectModal;
    }
  }, [accounts, _openConnectModal]);

  return { openConnectModal, openConnectModalAsync, disconnect };
};
