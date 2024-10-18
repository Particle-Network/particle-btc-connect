import type { FeeQuote, FeeQuotesResponse, UserOpBundle } from '@particle-network/aa';
import { useMemo } from 'react';
import gaslessIcon from '../../icons/aa-icon-gasless.png';
import close from '../../icons/close.svg';
import { shortString } from '../../utils';
import { formatToken } from '../../utils/ethereumUtils';
import styles from './selectGas.module.scss';

export type SelectedFeeQuote = {
  userOpBundle?: UserOpBundle; // gasless or native pay gas
  feeQuote?: FeeQuote; // native or erc-20
  tokenPaymasterAddress?: string; // erc-20
  gasless: boolean;
};

type Props = {
  feeQuotesResponse?: FeeQuotesResponse;
  selectedFeeQuote?: SelectedFeeQuote;
  onSelectedFeeQuote?: (selectedFeeQuote: SelectedFeeQuote) => void;
  isOpen: boolean;
  onClose: () => void;
};

const isInsufficient = (feeQuote: FeeQuote) => {
  return BigInt(feeQuote.balance) < BigInt(feeQuote.fee);
};

const SelectGas = ({ feeQuotesResponse, onSelectedFeeQuote, selectedFeeQuote, isOpen, onClose }: Props) => {
  const feeQuotes: SelectedFeeQuote[] = useMemo(() => {
    if (!feeQuotesResponse) {
      return [];
    }
    const { verifyingPaymasterGasless, verifyingPaymasterNative, tokenPaymaster } = feeQuotesResponse;
    const feeQuotes = [];
    if (verifyingPaymasterGasless) {
      const { userOp, userOpHash } = verifyingPaymasterGasless;
      feeQuotes.push({
        userOpBundle: { userOp, userOpHash },
        gasless: true,
      });
    }
    if (verifyingPaymasterNative) {
      const { userOp, userOpHash } = verifyingPaymasterNative;
      feeQuotes.push({
        userOpBundle: { userOp, userOpHash },
        feeQuote: verifyingPaymasterNative.feeQuote,
        gasless: false,
      });
    }
    if (tokenPaymaster) {
      feeQuotes.push(
        ...tokenPaymaster.feeQuotes.map((feeQuote) => ({
          feeQuote,
          tokenPaymasterAddress: tokenPaymaster.tokenPaymasterAddress,
          gasless: false,
        }))
      );
    }
    return feeQuotes;
  }, [feeQuotesResponse]);

  const isSelectFeeQuote = (feeQuote: SelectedFeeQuote) => {
    if (!selectedFeeQuote) {
      return false;
    }

    if (selectedFeeQuote.gasless) {
      return feeQuote.gasless;
    }

    return (
      selectedFeeQuote.feeQuote?.tokenInfo.address === feeQuote.feeQuote?.tokenInfo.address &&
      selectedFeeQuote.tokenPaymasterAddress === feeQuote.tokenPaymasterAddress
    );
  };

  const onFeeQuoteClick = (value: SelectedFeeQuote) => {
    if (!isSelectFeeQuote(value)) {
      onSelectedFeeQuote && onSelectedFeeQuote(value);
    }
    onClose();
  };

  return (
    <div
      className={styles.selectGasContainer}
      style={{
        display: isOpen ? 'block' : 'none',
      }}
    >
      <div className={styles.selectGasContent}>
        <div className={styles.title}>Network Fee</div>
        <img className={styles.closeBtn} src={close} onClick={onClose}></img>

        <div className={styles.feeQuotes}>
          {feeQuotes.map((item, index) => {
            const insufficient = item.feeQuote && isInsufficient(item.feeQuote);
            return (
              <div
                key={index}
                className={styles.feeQuote}
                onClick={insufficient ? undefined : () => onFeeQuoteClick(item)}
                style={{
                  cursor: insufficient ? 'not-allowed' : 'pointer',
                  borderColor: insufficient || !isSelectFeeQuote(item) ? '#00000000' : '#a855f7',
                  opacity: insufficient ? 0.4 : 1,
                }}
              >
                <img
                  className={styles.icon}
                  src={item.gasless ? gaslessIcon : item.feeQuote?.tokenInfo.logoURI}
                  alt="icon"
                />

                <div className={styles.feeInfo}>
                  <div className={styles.symbol}>{item.gasless ? 'Gasless' : item.feeQuote?.tokenInfo.symbol}</div>
                  {!item.gasless && (
                    <div className={styles.address}>{shortString(item.feeQuote?.tokenInfo.address)}</div>
                  )}
                </div>
                <div className={styles.feeBalance}>
                  <div
                    className={styles.gas}
                    style={{
                      color: item.gasless ? '#52c41a' : '#ff4d4f',
                    }}
                  >
                    {item.gasless
                      ? 'Free'
                      : `-${formatToken(BigInt(item.feeQuote!.fee), item.feeQuote!.tokenInfo.decimals)}`}
                  </div>
                  {!item.gasless && item.feeQuote && (
                    <div
                      className={styles.balance}
                      style={{
                        color: insufficient ? '#ff4d4f' : '#ffffffa1',
                      }}
                    >
                      {insufficient
                        ? 'Insufficient balance'
                        : formatToken(BigInt(item.feeQuote.balance), item.feeQuote.tokenInfo.decimals)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SelectGas;
