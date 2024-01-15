export {};

declare global {
  interface Window {
    unisat: {
      requestAccounts: () => Promise<string[]>;
      switchNetwork: (network: 'livenet' | 'testnet') => Promise<void>;
      getNetwork: () => Promise<string>;
      getPublicKey: () => Promise<string>;
      signMessage: (msg: string, type?: string) => Promise<string>;
      _selectedAddress?: string;
      on: (event: string, handler: (value: unknown) => void) => void;
    };
  }
}
