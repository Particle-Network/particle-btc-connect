import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react';
import { useETHProvider } from '@particle-network/btc-connectkit';
import { useRequest } from 'ahooks';
import { type Hex } from 'viem';

export const AccountInfoModal = ({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: () => void }) => {
  const { account, publicClient, getSmartAccountInfo } = useETHProvider();

  const { data: isDeploy } = useRequest(
    async () => {
      if (publicClient) {
        const result = await publicClient.getBytecode({ address: account as Hex });
        return Boolean(result);
      }

      return false;
    },
    { ready: isOpen }
  );

  const { data: accountInfo } = useRequest(
    async () => {
      const info = await getSmartAccountInfo();
      return info;
    },
    {
      ready: isOpen && Boolean(account),
    }
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Account Info</ModalHeader>

            <ModalBody>
              <div className="flex w-full flex-col">
                <span className="font-bold">Address: </span>
                <span className="whitespace-pre-wrap break-words">{account}</span>
              </div>

              {accountInfo && (
                <>
                  <div className="flex w-full flex-col">
                    <span className="font-bold">ImplementationAddress: </span>
                    <span className="whitespace-pre-wrap break-words">{accountInfo?.implementationAddress}</span>
                  </div>

                  <div className="flex w-full gap-2">
                    <span className="font-bold">implementationVersion: </span>
                    <span className="whitespace-pre-wrap break-words">{accountInfo?.implementationVersion}</span>
                  </div>
                </>
              )}

              <span className="font-bold">{`Deploy: ${isDeploy ?? false}`}</span>
            </ModalBody>

            <ModalFooter>
              <Button color="primary" onClick={onClose}>
                OK
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
