import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react';
import { useETHProvider } from '@particle-network/btc-connectkit';
import { useRequest } from 'ahooks';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { type Hex } from 'viem';

export const VerifyModal = ({
  isOpen,
  onOpenChange,
  signData,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  signData?: {
    signature: string;
    data: any;
  };
}) => {
  const { account, publicClient } = useETHProvider();

  const verifyPersonalSign = useCallback(async () => {
    if (!publicClient || !signData || !account) {
      throw new Error('params error');
    }

    const result = await publicClient.verifyMessage({
      address: account,
      message: signData.data,
      signature: signData.signature,
    });
    return result;
  }, [publicClient, account, signData]);

  const verifySignTypedData = useCallback(async () => {
    if (!publicClient || !signData || !account) {
      throw new Error('params error');
    }

    const result = await publicClient.verifyTypedData({
      address: account,
      signature: signData.signature,
      ...signData.data,
    });
    return result;
  }, [publicClient, account, signData]);

  const { run: onVerify, loading: verifyLoading } = useRequest(
    async () => {
      const code = await publicClient!.getBytecode({ address: account as Hex });
      if (!code) {
        throw new Error('The smart account not deploy.');
      }

      if (typeof signData?.data === 'string') {
        return await verifyPersonalSign();
      } else {
        return await verifySignTypedData();
      }
    },
    {
      manual: true,
      onSuccess: (result) => {
        if (result) {
          toast.success('Verification Successful');
        } else {
          toast.error('Verification Failed');
        }
      },
      onError: (error: any) => {
        toast.error(error.details || error.message || 'Verification Failed');
      },
      onFinally: () => {
        onOpenChange();
      },
    }
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Signature Verification</ModalHeader>
            <ModalBody>
              <div className="flex w-full flex-col">
                <span className="font-bold">Address: </span>
                <span className="whitespace-pre-wrap break-words">{account}</span>
              </div>

              <div className="flex w-full flex-col">
                <span className="font-bold">Signature: </span>
                <span className="whitespace-pre-wrap break-words">{signData?.signature}</span>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onClick={onVerify} isLoading={verifyLoading}>
                Verify
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
