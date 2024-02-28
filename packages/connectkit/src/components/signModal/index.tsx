import type { UserOpBundle } from '@particle-network/aa';
import { chains } from '@particle-network/chains';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatEther } from 'viem';
import { useConnectProvider } from '../../context';
import { useETHProvider } from '../../hooks';
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

const testDetails = `
[
  {
      "chainId": 80001,
      "type": "native_transfer",
      "toTag": null,
      "toParsedType": 0,
      "estimatedChanges": {
          "natives": [
              {
                  "address": "0x4CCc0631507b5Dd2474aE5aEceF0324c89db9d69",
                  "nativeChange": "-1110"
              }
          ],
          "nfts": [],
          "tokens": []
      },
      "data": {
          "from": "0x4CCc0631507b5Dd2474aE5aEceF0324c89db9d69",
          "nonce": "0x0",
          "gasPrice": "0x0",
          "gasLimit": "0x0",
          "to": "0xe8fc0baE43aA264064199dd494d0f6630E692e73",
          "value": "0x0",
          "data": "0x",
          "type": "0x0",
          "function": {
              "name": "SENDING MATIC",
              "params": []
          }
      },
      "securityDetection": []
  },
  {
    "type": "erc20_transfer",
    "estimatedChanges": {
      "natives": [],
      "nfts": [],
      "tokens": [
        {
          "address": "0x6De3e391811cd333a0B5Ed03F76557779cc0Ad96",
          "name": "PLAYZAP",
          "symbol": "PZP",
          "image": "",
          "decimals": 18,
          "fromAddress": "0x631571040DD9fe3BF37BDcA6b2731dbe2Ae8bA9E",
          "amountChange": "-1000000000000000000"
        }
      ]
    },
    "data": {
      "from": "0x631571040DD9fe3BF37BDcA6b2731dbe2Ae8bA9E",
      "chainId": "0x5",
      "nonce": "0x0",
      "maxPriorityFeePerGas": "0x0",
      "maxFeePerGas": "0x0",
      "gasLimit": "0xdd9b",
      "to": "0x6De3e391811cd333a0B5Ed03F76557779cc0Ad96",
      "value": "0x0",
      "data": "0xa9059cbb000000000000000000000000329a7f8b91ce7479035cb1b5d62ab41845830ce80000000000000000000000000000000000000000000000000de0b6b3a7640000",
      "accessList": [],
      "v": "0x0",
      "type": "0x2",
      "function": {
        "name": "transfer",
        "params": [
          {
            "name": "to",
            "value": "0x329a7f8b91ce7479035cb1b5d62ab41845830ce8",
            "type": "address"
          },
          {
            "name": "amount",
            "value": "1000000000000000000",
            "type": "uint256"
          }
        ]
      }
    }
  },
  {
    "type": "erc20_approve",
    "estimatedChanges": {
      "natives": [],
      "nfts": [],
      "tokens": [
        {
          "address": "0x6f9F0c4ad9Af7EbD61Ac5A1D4e0F2227F7B0E5f9",
          "name": "Era Token",
          "symbol": "ERA",
          "image": "https://static.particle.network/token-list/bsc/0x6f9F0c4ad9Af7EbD61Ac5A1D4e0F2227F7B0E5f9.png",
          "decimals": 18,
          "fromAddress": "0xDB25dCB31CF413ee4F7C47B9a6AF9aF3Bf7De1B0",
          "amountChange": ""
        }
      ]
    },
    "data": {
      "from": "0xDB25dCB31CF413ee4F7C47B9a6AF9aF3Bf7De1B0",
      "nonce": "0x0",
      "gasPrice": "0x2faf080",
      "gasLimit": "0xc1f3",
      "to": "0x6f9F0c4ad9Af7EbD61Ac5A1D4e0F2227F7B0E5f9",
      "value": "0x0",
      "data": "0x095ea7b3000000000000000000000000bd3bd95529e0784ad973fd14928eedf3678cfad8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      "type": "0x0",
      "function": {
        "name": "approve",
        "params": [
          {
            "name": "_spender",
            "value": "0xbd3bd95529e0784ad973fd14928eedf3678cfad8",
            "type": "address"
          },
          {
            "name": "_value",
            "value": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            "type": "uint256"
          }
        ]
      }
    }
  },
  {
    "type": "erc721_transfer",
    "estimatedChanges": {
      "natives": [],
      "nfts": [
        {
          "address": "0x99EcdF17DED4fCb6C5f0fE280d21f832af464f67",
          "name": "Cyber Turtle #1729",
          "symbol": "",
          "image": "ipfs://QmTynTQ2dL4etGJTLDMLLsQdJdWSxKE15NG12vTbh1mzPr/1729.png",
          "fromAddress": "0x03afC65278E6D37f23bC0B8Bf4C9d61Bd35edFC8",
          "tokenId": "1729",
          "amountChange": "-1"
        }
      ],
      "tokens": []
    },
    "data": {
      "from": "0x03afC65278E6D37f23bC0B8Bf4C9d61Bd35edFC8",
      "chainId": "0x1",
      "nonce": "0x30a",
      "maxPriorityFeePerGas": "0x3b9aca00",
      "maxFeePerGas": "0x608379d4b",
      "gasLimit": "0x1122e",
      "to": "0x99EcdF17DED4fCb6C5f0fE280d21f832af464f67",
      "value": "0x0",
      "data": "0x42842e0e00000000000000000000000003afc65278e6d37f23bc0b8bf4c9d61bd35edfc8000000000000000000000000a058fb195d274afbae4dc317be362d4e96ffa1b400000000000000000000000000000000000000000000000000000000000006c1",
      "accessList": [],
      "v": "0x1",
      "r": "0xf7e0c908e4b549d24dad47f28205d3437e00b123e9b57bec95dcd61e1fd8065c",
      "s": "0x53495aaeec3740c0520e7717060a208aac0970dbc30ef3380e3ae9f81f4f6f66",
      "type": "0x2",
      "function": {
        "name": "safeTransferFrom",
        "params": [
          {
            "name": "from_",
            "value": "0x03afc65278e6d37f23bc0b8bf4c9d61bd35edfc8",
            "type": "address"
          },
          {
            "name": "to_",
            "value": "0xa058fb195d274afbae4dc317be362d4e96ffa1b4",
            "type": "address"
          },
          {
            "name": "tokenId_",
            "value": "1729",
            "type": "uint256"
          }
        ]
      }
    }
  },
  {
    "type": "erc1155_transfer",
    "estimatedChanges": {
      "natives": [],
      "nfts": [
        {
          "address": "0x99EcdF17DED4fCb6C5f0fE280d21f832af464f67",
          "name": "ABC Turtle #1729",
          "symbol": "",
          "image": "ipfs://QmTynTQ2dL4etGJTLDMLLsQdJdWSxKE15NG12vTbh1mzPr/1729.png",
          "fromAddress": "0x03afC65278E6D37f23bC0B8Bf4C9d61Bd35edFC8",
          "tokenId": "1729",
          "amountChange": "-1"
        }
      ],
      "tokens": []
    },
    "data": {
      "from": "0x03afC65278E6D37f23bC0B8Bf4C9d61Bd35edFC8",
      "chainId": "0x1",
      "nonce": "0x30a",
      "maxPriorityFeePerGas": "0x3b9aca00",
      "maxFeePerGas": "0x608379d4b",
      "gasLimit": "0x1122e",
      "to": "0x99EcdF17DED4fCb6C5f0fE280d21f832af464f67",
      "value": "0x0",
      "data": "0x42842e0e00000000000000000000000003afc65278e6d37f23bc0b8bf4c9d61bd35edfc8000000000000000000000000a058fb195d274afbae4dc317be362d4e96ffa1b400000000000000000000000000000000000000000000000000000000000006c1",
      "accessList": [],
      "v": "0x1",
      "r": "0xf7e0c908e4b549d24dad47f28205d3437e00b123e9b57bec95dcd61e1fd8065c",
      "s": "0x53495aaeec3740c0520e7717060a208aac0970dbc30ef3380e3ae9f81f4f6f66",
      "type": "0x2",
      "function": {
        "name": "safeTransferFrom",
        "params": [
          {
            "name": "from_",
            "value": "0x03afc65278e6d37f23bc0b8bf4c9d61bd35edfc8",
            "type": "address"
          },
          {
            "name": "to_",
            "value": "0xa058fb195d274afbae4dc317be362d4e96ffa1b4",
            "type": "address"
          },
          {
            "name": "tokenId_",
            "value": "1729",
            "type": "uint256"
          }
        ]
      }
    }
  },
  {
    "type": "other",
    "estimatedChanges": {
      "natives": [
        {
          "address": "0xe7E6c88Ad1BAb6508a251B7995f44fB1C5E3dCF7",
          "nativeChange": "-202048411000000000"
        }
      ],
      "nfts": [],
      "tokens": []
    },
    "data": {
      "from": "0xe7E6c88Ad1BAb6508a251B7995f44fB1C5E3dCF7",
      "chainId": "0x1",
      "nonce": "0x79c9c",
      "maxPriorityFeePerGas": "0x3b9aca00",
      "maxFeePerGas": "0x131794b400",
      "gasLimit": "0x186a0",
      "to": "0x9cE71ADB6807ca0DC5b5278a38188f75549F76e0",
      "value": "0x2cdd1f595164e00",
      "data": "0x",
      "accessList": [],
      "type": "0x2",
      "v": "0x1",
      "r": "0x26858e9a3bc0d876862ac4a2deb86b6e97887964449e6c69115f5d82a37a41bc",
      "s": "0x10c5736caf2b8cc49e9abc92e4b588b6d0d0ba543e23180cfccd31fab70f809e"
    }
  }
]
`;

const SignModal = ({ open, onClose, onOpen }: { open: boolean; onClose: () => void; onOpen: () => void }) => {
  const [userOpBundle, setUserOpBundle] = useState<UserOpBundle>();
  const [notRemindChecked, setNotRemindChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deserializeResult, setDeserializeResult] = useState<EVMDeserializeTransactionResult[] | undefined>(
    JSON.parse(testDetails)
  );
  const [disabled, setDisabled] = useState<boolean>(false);
  const [showNotRemind, setShowNotRemind] = useState<boolean>(true);

  const { chainId, publicClient, evmAccount } = useETHProvider();
  const { smartAccount } = useConnectProvider();

  useEffect(() => {
    if (!open) {
      setDeserializeResult(undefined);
      setUserOpBundle(undefined);
      setLoading(false);
      setDisabled(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setShowNotRemind(!txConfirm.isNotRemind());
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
    if (userOpBundle && publicClient && smartAccount) {
      const addresses = await smartAccount.provider.request({ method: 'eth_accounts' });
      const owner = addresses[0];
      const result = await publicClient.request({
        method: 'particle_aa_deserializeUserOp' as any,
        params: [
          {
            name: 'BTC',
            version: '1.0.0',
            ownerAddress: owner,
          } as any,
          userOpBundle.userOp as any,
        ],
      });
      return result;
    }
  }, [userOpBundle, publicClient, smartAccount]);

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
        });
    }
  }, [deserializeUserOp, userOpBundle, open]);

  const toggleNotRemind = () => {
    setNotRemindChecked(!notRemindChecked);
    txConfirm.setNotRemind(!notRemindChecked);
  };

  const gasFee = useMemo(() => {
    if (userOpBundle?.userOp) {
      return formatEther(caculateNativeFee(userOpBundle?.userOp));
    }
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
        if (typeof error === 'string') {
          events.emit(EventName.sendUserOpResult, {
            error: {
              code: -32603, // Internal error
              message: error,
            },
          });
        } else {
          events.emit(EventName.sendUserOpResult, {
            error,
          });
        }
      } finally {
        setLoading(false);
      }
      onClose();
    }
  }, [smartAccount, userOpBundle, onClose]);

  return (
    <Modal open={open} onClose={onClose} isDismissable={false} contentClassName={styles.modalContent}>
      <img className={styles.closeBtn} src={close} onClick={closeModal}></img>

      <div className={styles.chainInfo}>
        <img src={chainInfo?.icon}></img>
        {chainInfo?.fullname.replace('Mainnet', '')}
      </div>

      <div className={styles.addressContainer}>
        <CopyText value={evmAccount}>
          <div className={styles.addressInfo}>
            {shortString(evmAccount)}
            <img src={copy}></img>
          </div>
        </CopyText>
      </div>

      <div className={styles.detailsContent}>
        {deserializeResult &&
          deserializeResult.map((details, index) => (
            <TransactionDetails key={`${details.type}-${index}`} details={details} />
          ))}
      </div>

      {gasFee && (
        <div className={styles.estimatedGas}>{`Estimated gas fee: ${gasFee} ${chainInfo?.nativeCurrency.symbol}`}</div>
      )}

      <Button onClick={confirmTx} className={styles.signBtn} isLoading={loading} isDisabled={disabled}>
        CONFIRM
      </Button>

      {showNotRemind && (
        <div className={styles.notRemind} onClick={toggleNotRemind}>
          <img src={notRemindChecked ? checkBox : checkBoxBlank}></img>
          Do not remind me again
        </div>
      )}
    </Modal>
  );
};

export default SignModal;
