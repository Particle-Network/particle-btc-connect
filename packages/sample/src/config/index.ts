export const accountContracts = {
  BTC: [
    {
      chainIds: [4200, 686868, 28206, 11503, 1501, 1502, 22776, 212, 3110, 1],
      version: '1.0.0',
    },
    {
      chainIds: [200901, 200810, 3636, 2442, 1123, 223, 5000, 5003, 2648, 111],
      version: '2.0.0',
    },
  ],
  // UNIVERSAL: [
  //   {
  //     chainIds: [11155111],
  //     version: '1.0.0',
  //   },
  // ],
};

export type ContractName = keyof typeof accountContracts;
