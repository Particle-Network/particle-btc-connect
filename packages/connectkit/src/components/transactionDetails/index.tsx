import { chains } from '@particle-network/chains';
import { useCallback, useMemo } from 'react';
import { formatUnits } from 'viem';
import { useETHProvider } from '../../hooks';
import unverified from '../../icons/unverified.svg';
import verified from '../../icons/verified.svg';
import {
  TransactionSmartType,
  type EVMDeserializeTransactionResult,
  type EVMTokenChange,
} from '../../types/deserializeTx';
import { defaultTokenIcon, ipfsToSrc, shortString } from '../../utils';
import CopyText from '../copyText';
import Tooltip from '../tooltip';
import styles from './transactionDetails.module.scss';

const TransactionDetails = ({ details }: { details: EVMDeserializeTransactionResult }) => {
  const { chainId } = useETHProvider();

  const chainInfo = useMemo(() => {
    if (chainId) {
      return chains.getEVMChainInfoById(chainId);
    }
  }, [chainId]);

  const titleContent = useMemo(() => {
    switch (details.type) {
      case TransactionSmartType.NATIVE_TRANSFER:
        return `Send ${chainInfo?.nativeCurrency.symbol}`;
      case TransactionSmartType.ERC20_TRANSFER:
        return `Send ${details.estimatedChanges.tokens[0]?.symbol}`;
      case TransactionSmartType.ERC20_APPROVE:
        return 'Approve Spending';
      case TransactionSmartType.ERC721_TRANFER:
        return 'Send NFT';
      case TransactionSmartType.ERC1155_TRANFER:
        return 'Send NFT';
      default:
        return 'Transaction Details';
    }
  }, [details, chainInfo]);

  const nftContractType = useMemo(() => {
    if (details.type === TransactionSmartType.ERC721_TRANFER) {
      return 'ERC721';
    } else if (details.type === TransactionSmartType.ERC1155_TRANFER) {
      return 'ERC1155';
    }
  }, [details]);

  const nativeIcon = useMemo(() => {
    if (chainInfo) {
      if (chainInfo.nativeCurrency.symbol === 'ETH') {
        return 'https://static.particle.network/token-list/ethereum/native.png';
      } else {
        return chainInfo.nativeIcon || chainInfo.icon;
      }
    }
    return defaultTokenIcon;
  }, [chainInfo]);

  // to address
  const to = useMemo(() => {
    const params = details.data?.function?.params;
    if (details.type == TransactionSmartType.ERC20_TRANSFER) {
      return params ? (params[params.length === 3 ? 1 : 0].value as string) : '';
    } else if (details.type == TransactionSmartType.ERC20_APPROVE) {
      return params ? (params[0].value as string) : '';
    } else if (details.type == TransactionSmartType.NATIVE_TRANSFER) {
      return details.data.to;
    } else if (
      details.type == TransactionSmartType.ERC721_TRANFER ||
      details.type == TransactionSmartType.ERC1155_TRANFER
    ) {
      return params ? (params[1].value as string) : '';
    } else {
      return details.data.to;
    }
  }, [details]);

  const balanceChangeTextColor = useCallback((value: string | number) => {
    if (BigInt(value) > 0) {
      return '#4ade80';
    } else if (BigInt(value) < 0) {
      return '#ef4444';
    } else {
      return 'white';
    }
  }, []);

  const functionContent = useMemo(() => {
    if (details.type !== TransactionSmartType.NATIVE_TRANSFER && details.data.function) {
      const params = details.data.function.params.map((item) => item.name);
      return `${details.data.function.name}(${params.join(', ')})`;
    }
  }, [details]);

  const approveTokenAmount = useMemo(() => {
    if (details.type === TransactionSmartType.ERC20_APPROVE) {
      const amount = details.data?.function?.params?.[1]?.value as string;
      return BigInt(amount || 0);
    }
    return BigInt(0);
  }, [details]);

  const tokenAmountChange = useCallback(
    (tokenItem: EVMTokenChange) => {
      const result = formatUnits(
        details.type === TransactionSmartType.ERC20_APPROVE ? approveTokenAmount : BigInt(tokenItem.amountChange),
        tokenItem.decimals
      );

      if (details.type !== TransactionSmartType.ERC20_APPROVE && BigInt(tokenItem.amountChange) > BigInt(0)) {
        return `+${result}`;
      }

      return result;
    },
    [approveTokenAmount, details]
  );

  const showContactAddress = useMemo(() => {
    return (
      details.type === TransactionSmartType.ERC20_TRANSFER ||
      details.type === TransactionSmartType.ERC20_APPROVE ||
      details.type === TransactionSmartType.ERC721_TRANFER ||
      details.type === TransactionSmartType.ERC1155_TRANFER
    );
  }, [details]);

  return (
    <div className={styles.detailsCard}>
      <div className={styles.title}>{titleContent}</div>
      {nftContractType && <div className={styles.nftContract}>{nftContractType}</div>}

      {details.estimatedChanges.natives.map((nativeItem) => {
        return (
          <div key={nativeItem.address} className={styles.row}>
            <img className={styles.tokenIcon} src={nativeIcon}></img>
            <div className={styles.balanceChange} style={{ color: balanceChangeTextColor(nativeItem.nativeChange) }}>
              {BigInt(nativeItem.nativeChange) > 0 ? '+' : undefined}
              {formatUnits(BigInt(nativeItem.nativeChange), chainInfo?.nativeCurrency.decimals || 18)}
            </div>
            <div className={styles.tokenSymbol}>{chainInfo?.nativeCurrency.symbol}</div>
          </div>
        );
      })}

      {details.estimatedChanges.tokens.map((tokenItem) => {
        return (
          <div key={tokenItem.address} className={styles.row}>
            <img className={styles.tokenIcon} src={tokenItem.image || defaultTokenIcon}></img>
            <div className={styles.balanceChange}>
              <span style={{ color: balanceChangeTextColor(tokenItem.amountChange) }}>
                {tokenAmountChange(tokenItem)}
              </span>
              {` ${tokenItem.symbol}`}
            </div>
          </div>
        );
      })}

      {details.estimatedChanges.nfts.map((nftItem) => {
        return (
          <div key={nftItem.address} className={styles.row}>
            <div style={{ fontSize: 16 }}>
              <img className={styles.nftIcon} src={ipfsToSrc(nftItem.image || defaultTokenIcon)}></img>
              {nftItem.name || `NFT#${nftItem.tokenId}`}
            </div>
            <div className={styles.balanceChange} style={{ color: balanceChangeTextColor(nftItem.amountChange) }}>
              {nftItem.amountChange}
            </div>
          </div>
        );
      })}

      {to && (
        <div className={styles.row}>
          <div>To</div>
          <div className={styles.toContract}>
            {details.toVerified != null && !showContactAddress && (
              <Tooltip content={details.toVerified ? 'Verified Contract' : 'Unverified Contract'}>
                <img src={details.toVerified ? verified : unverified}></img>
              </Tooltip>
            )}
            <CopyText value={to}>{shortString(to)}</CopyText>
          </div>
        </div>
      )}

      {showContactAddress && (
        <div className={styles.row}>
          <div>Contract</div>
          <div className={styles.toContract}>
            {details.toVerified != null && (
              <Tooltip content={details.toVerified ? 'Verified Contract' : 'Unverified Contract'}>
                <img src={details.toVerified ? verified : unverified}></img>
              </Tooltip>
            )}
            <CopyText value={details.data.to}>{shortString(details.data.to)}</CopyText>
          </div>
        </div>
      )}

      <div className={styles.row}>
        <div>Hex Data</div>
        <CopyText value={details.data.data}>{shortString(details.data.data)}</CopyText>
      </div>

      {functionContent && (
        <div className={styles.row}>
          <div>Function</div>
          <div className={styles.right}>{functionContent}</div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetails;
