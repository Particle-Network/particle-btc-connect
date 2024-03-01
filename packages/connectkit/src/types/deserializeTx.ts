export type PrefixedHexString = string; //'0x....'

export type DecimalString = string; //'10000'

export enum TransactionSmartType {
  NATIVE_TRANSFER = 'native_transfer',
  ERC20_TRANSFER = 'erc20_transfer',
  ERC20_APPROVE = 'erc20_approve', //Approve Token
  ERC721_TRANFER = 'erc721_transfer',
  ERC1155_TRANFER = 'erc1155_transfer',
  OTHER = 'other', // Send Transaction
}

export type EVMDeserializeTransactionResult = {
  type?: TransactionSmartType;
  estimatedChanges: EVMEstimatedChange;
  toVerified?: boolean;
  data: EVMData;
  toTag?: string;
  price?: NftPrice;
  securityDetection?: SecurityDetection[];
};

export type NftPrice = {
  address: string;
  amount: string;
  decimals: number;
  symbol: string;
};

export type SecurityDetection = {
  type: string;
  risks?: string[];
  warnings?: string[];
};

export type EVMEstimatedChange = {
  natives: EVMNativeChange[];
  nfts: EVMNFTChange[];
  tokens: EVMTokenChange[];
};

export type EVMNativeChange = {
  address: PrefixedHexString;
  nativeChange: DecimalString;
};

export type EVMNFTChange = {
  name: string;
  symbol: string;
  image: string;
  address: string;
  fromAddress: string;
  amountChange: number;
  tokenId: string;
  amount?: string;
  isSemiFungible?: boolean;
  description?: string;
};

export type EVMTokenChange = {
  decimals: number;
  name: string;
  symbol: string;
  image: string;
  address: string;
  fromAddress: string;
  amountChange: number;
};

export interface Consideration {
  address: string;
  amount: string;
  decimals: number;
  recipient: string;
  symbol: string;
}

export interface EVMData {
  from: PrefixedHexString;
  chainId: PrefixedHexString;
  nonce: PrefixedHexString;
  maxPriorityFeePerGas: PrefixedHexString;
  maxFeePerGas: PrefixedHexString;
  gasPrice: PrefixedHexString;
  gasLimit: PrefixedHexString;
  to: PrefixedHexString;
  value: PrefixedHexString;
  data: PrefixedHexString;
  v?: PrefixedHexString;
  r?: PrefixedHexString;
  s?: PrefixedHexString;
  function?: EVMFunction;
  offer?: EVMNFTChange[];
  offerer?: string;
  consideration?: Consideration[];
  startTime?: string;
  endTime?: string;
}

export interface EVMFunction {
  name: string;
  params: EVMParam[];
}

export interface EVMParam {
  name: string;
  value: unknown;
  type: string;
}
