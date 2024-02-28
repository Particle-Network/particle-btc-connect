import { useCallback } from 'react';
import { useConnectProvider } from '../context';

export const useConnector = () => {
  const { connectors, setConnectorId } = useConnectProvider();

  const connect = useCallback(
    async (connectorId: string) => {
      const connector = connectors.find((item) => item.metadata.id === connectorId);
      if (!connector) {
        throw new Error(`connector id ${connectorId} not found`);
      }
      const accounts = await connector.requestAccounts();
      if (accounts.length > 0) {
        localStorage.setItem('current-connector-id', connector.metadata.id);
        setConnectorId(connector.metadata.id);
      }
    },
    [connectors, setConnectorId]
  );

  return { connectors, connect };
};
