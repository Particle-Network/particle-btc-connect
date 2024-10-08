import { chains } from '@particle-network/chains';

export type BTCConfig = {
  chainIds: number[];
  version: string;
};

export const accountContracts = {
  BTC: chains
    .getAllChainInfos()
    .filter((chain) => chain.chainType === 'evm')
    .filter(
      (chain) =>
        chain.features?.some(
          (feature) => feature.name === 'ERC4337' && feature.contracts?.some((contract) => contract.name === 'BTC')
        )
    )
    .reduce((value, current) => {
      const versins = current.features
        ?.find((feature) => feature.name === 'ERC4337')
        ?.contracts?.filter((contract) => contract.name === 'BTC')
        .map((contract) => contract.version) as string[];
      versins.forEach((version) => {
        const configItem = value.find((config) => config.version === version);
        if (configItem) {
          configItem.chainIds.push(current.id);
        } else {
          value.push({
            version,
            chainIds: [current.id],
          });
        }
      });
      return value;
    }, [] as BTCConfig[]),
};

export type ContractName = keyof typeof accountContracts;
