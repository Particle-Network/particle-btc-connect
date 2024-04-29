import type { UserOpBundle } from '@particle-network/aa';
import { chains } from '@particle-network/chains';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatEther, type Hex } from 'viem';
import { useConnectProvider } from '../../context';
import { useETHProvider } from '../../hooks';
import { useAccountContract } from '../../hooks/useAccountContract';
import checkBox from '../../icons/check_box.svg';
import checkBoxBlank from '../../icons/check_box_blank.svg';
import close from '../../icons/close.svg';
import copy from '../../icons/copy.svg';
import { type EVMDeserializeTransactionResult } from '../../types/deserializeTx';
import { EventName } from '../../types/eventName';
import { shortString } from '../../utils';
import { caculateNativeFee } from '../../utils/ethereumUtils';
import events from '../../utils/eventUtils';
import txConfirm from '../../utils/txConfirmUtils';
import Button from '../button';
import CopyText from '../copyText';
import Modal from '../modal';
import TransactionDetails from '../transactionDetails';
import styles from './sign.module.scss';

const SignModal = ({ open, onClose, onOpen }: { open: boolean; onClose: () => void; onOpen: () => void }) => {
  const [userOpBundle, setUserOpBundle] = useState<UserOpBundle>();
  const [notRemindChecked, setNotRemindChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deserializeLoading, setDeserializeLoading] = useState<boolean>(false);
  const [deserializeResult, setDeserializeResult] = useState<EVMDeserializeTransactionResult[] | undefined>();
  const [disabled, setDisabled] = useState<boolean>(false);
  const [showNotRemind, setShowNotRemind] = useState<boolean>(true);
  const [nativeBalance, setNativeBalance] = useState<bigint>();
  const { accountContract } = useAccountContract();

  const { chainId, publicClient, evmAccount } = useETHProvider();
  const { smartAccount } = useConnectProvider();

  useEffect(() => {
    if (!open) {
      setDeserializeResult(undefined);
      setUserOpBundle(undefined);
      setLoading(false);
      setDisabled(false);
      setDeserializeLoading(false);
      setNativeBalance(undefined);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const notRemind = txConfirm.isNotRemind();
      setShowNotRemind(!notRemind);
      if (!notRemind) {
        setNotRemindChecked(false);
      }
    }
  }, [open]);

  const chainInfo = useMemo(() => {
    if (chainId) {
      return chains.getEVMChainInfoById(chainId);
    }
  }, [chainId]);

  useEffect(() => {
    const onSendUserOp = (opBundle: UserOpBundle) => {
      setUserOpBundle(opBundle);
      onOpen();
    };
    events.on(EventName.sendUserOp, onSendUserOp);
    return () => {
      events.off(EventName.sendUserOp, onSendUserOp);
    };
  }, [onOpen, setUserOpBundle]);

  const deserializeUserOp = useCallback(async () => {
    if (userOpBundle && smartAccount) {
      const addresses = await smartAccount.provider.request({ method: 'eth_accounts' });
      const owner = addresses[0];
      const result = await smartAccount.sendRpc({
        method: 'particle_aa_deserializeUserOp',
        params: [
          {
            name: accountContract.name,
            version: accountContract.version,
            ownerAddress: owner,
          },
          userOpBundle.userOp,
        ],
      });
      return result;
    }
  }, [userOpBundle, smartAccount, accountContract]);

  useEffect(() => {
    if (userOpBundle && open) {
      console.log('deserializeUserOp start');
      deserializeUserOp()
        .then((result) => {
          console.log('🚀 ~ deserializeUserOp ~ result:', result);
          setDeserializeResult(result as any);
        })
        .catch((error) => {
          console.log('🚀 ~ deserializeUserOp ~ error:', error);
          events.emit(EventName.sendUserOpResult, {
            error,
          });
          onClose();
        });
    }
  }, [deserializeUserOp, userOpBundle, open, onClose]);

  useEffect(() => {
    if (open && publicClient && evmAccount) {
      publicClient
        .getBalance({ address: evmAccount as Hex })
        .then((result) => setNativeBalance(result))
        .catch((error) => {
          console.log('🚀 ~ getBalance ~ error:', error);
          events.emit(EventName.sendUserOpResult, {
            error,
          });
          onClose();
        });
    }
  }, [open, publicClient, evmAccount, onClose]);

  useEffect(() => {
    if (nativeBalance != null && deserializeResult != null) {
      setDeserializeLoading(false);
    } else {
      setDeserializeLoading(true);
    }
  }, [nativeBalance, deserializeResult]);

  const toggleNotRemind = () => {
    setNotRemindChecked(!notRemindChecked);
    txConfirm.setNotRemind(!notRemindChecked);
  };

  const gasFee = useMemo(() => {
    if (userOpBundle?.userOp) {
      return caculateNativeFee(userOpBundle?.userOp);
    }
    return BigInt(0);
  }, [userOpBundle]);

  const closeModal = () => {
    events.emit(EventName.sendUserOpResult, {
      error: {
        code: 4001,
        message: 'The user rejected the request.',
      },
    });
    onClose();
  };

  const confirmTx = useCallback(async () => {
    if (smartAccount && userOpBundle) {
      setLoading(true);
      try {
        const hash = await smartAccount.sendUserOperation(userOpBundle);
        events.emit(EventName.sendUserOpResult, { result: hash });
      } catch (error) {
        events.emit(EventName.sendUserOpResult, {
          error,
        });
      } finally {
        setLoading(false);
      }
      onClose();
    }
  }, [smartAccount, userOpBundle, onClose]);

  useEffect(() => {
    if (userOpBundle && nativeBalance != null && deserializeResult) {
      const nativeChange = deserializeResult
        .filter(
          (item) =>
            item.estimatedChanges.natives?.[0]?.nativeChange &&
            item.estimatedChanges.natives[0].nativeChange.startsWith('-')
        )
        .map((item) => BigInt(item.estimatedChanges?.natives?.[0]?.nativeChange?.replace('-', '') || 0))
        .reduce((accumulator, currentValue) => accumulator + currentValue, BigInt(0));
      if (userOpBundle.userOp.paymasterAndData.length > 2) {
        // 计算余额，需大于等于nativeChange
        setDisabled(nativeBalance < nativeChange);
      } else {
        // 计算余额，需大于等于gasFee+nativeChange
        setDisabled(nativeBalance < gasFee + nativeChange);
      }
    }
  }, [userOpBundle, gasFee, nativeBalance, deserializeResult]);

  return (
    <Modal open={open} onClose={onClose} isDismissable={false} contentClassName={styles.modalContent}>
      <>
        <img className={styles.closeBtn} src={close} onClick={closeModal}></img>

        <div className={styles.chainInfo}>
          <img src={chainInfo?.icon}></img>
          {chainInfo?.fullname.replace('Mainnet', '')}
        </div>

        <div className={styles.addressContainer}>
          <CopyText value={evmAccount} style={{ textDecorationLine: 'none' }}>
            <div className={styles.addressInfo}>
              {shortString(evmAccount)}
              <img src={copy}></img>
            </div>
          </CopyText>
        </div>

        <div className={styles.detailsContent + (deserializeResult ? ` ${styles.fill}` : '')}>
          {deserializeResult &&
            deserializeResult.map((details, index) => (
              <TransactionDetails key={`${details.type}-${index}`} details={details} />
            ))}
        </div>

        {gasFee && (
          <div className={styles.estimatedGas}>{`Estimated gas fee: ${formatEther(gasFee)} ${chainInfo?.nativeCurrency
            .symbol}`}</div>
        )}

        <Button
          onClick={confirmTx}
          className={styles.signBtn}
          isLoading={loading || deserializeLoading}
          isDisabled={disabled}
        >
          {deserializeLoading ? 'LOADING' : disabled ? 'INSUFFICIENT FEE' : 'CONFIRM'}
        </Button>

        {showNotRemind && (
          <div className={styles.notRemind} onClick={toggleNotRemind}>
            <img src={notRemindChecked ? checkBox : checkBoxBlank}></img>
            Do not remind me again
          </div>
        )}
      </>
    </Modal>
  );
};

export default SignModal;
