'use client';

import bitcoinIcon from '@/assets/bitcoin.png';
import particleLogo from '@/assets/particle-logo.svg';
import { accountContracts } from '@/config';
import { Button, Checkbox, Divider, Input, Select, SelectItem } from '@nextui-org/react';
import {
  useAccounts,
  useBTCProvider,
  useConnectModal,
  useConnector,
  useETHProvider,
} from '@particle-network/btc-connectkit';
import { chains } from '@particle-network/chains';
import { useRequest } from 'ahooks';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function Home() {
  const { openConnectModal, disconnect } = useConnectModal();
  const { accounts } = useAccounts();
  const { evmAccount, smartAccount, chainId, switchChain } = useETHProvider();
  const { provider, getNetwork, switchNetwork, signMessage, getPublicKey, sendBitcoin, sendInscription } =
    useBTCProvider();
  const [gasless, setGasless] = useState<boolean>(false);
  const [inscriptionReceiverAddress, setInscriptionReceiverAddress] = useState<string>();
  const [inscriptionId, setInscriptionId] = useState<string>();
  const [message, setMessage] = useState<string>('Hello, Particle!');
  const [address, setAddress] = useState<string>();
  const [satoshis, setSatoshis] = useState<string>('1');
  const { connectors, connect } = useConnector();

  const onGetNetwork = async () => {
    try {
      const network = await getNetwork();
      toast.success(network);
    } catch (error: any) {
      console.log('🚀 ~ onGetNetwork ~ error:', error);
      toast.error(error.message || 'get network error');
    }
  };

  const onSwitchNetwork = async () => {
    try {
      const network = await getNetwork();
      const changeTo = network === 'livenet' ? 'testnet' : 'livenet';
      await switchNetwork(changeTo);
      toast.success(`Change To ${changeTo}`);
    } catch (error: any) {
      console.log('🚀 ~ onSwitchNetwork ~ error:', error);
      toast.error(error.message || 'switch chain error');
    }
  };

  const onGetPubkey = async () => {
    try {
      const pubKey = await getPublicKey();
      console.log('🚀 ~ onGetPubkey ~ pubKey:', pubKey);
      toast.success(pubKey);
    } catch (error: any) {
      toast.error(error.message || 'get pubkey error');
    }
  };

  const onSignMessage = async () => {
    if (!message) {
      return;
    }
    try {
      const sig = await signMessage(message);
      toast.success(sig);
    } catch (error: any) {
      toast.error(error.message || 'sign message error');
    }
  };

  const onSendBitcoin = async () => {
    if (!address || !satoshis) {
      return;
    }
    try {
      const txId = await sendBitcoin(address, Number(satoshis));
      toast.success(txId);
    } catch (error: any) {
      toast.error(error.message || 'send bitcoin error');
    }
  };

  const onSendInscription = async () => {
    if (!inscriptionReceiverAddress || !inscriptionId || !provider) {
      return;
    }
    try {
      const result = await sendInscription(inscriptionReceiverAddress, inscriptionId);
      const txId = result.txid;
      console.log('send inscription success, txid:', txId);
      toast.success(`send success \n${txId}`);
    } catch (error: any) {
      toast.error(error.message || 'send inscription error');
    }
  };

  const onSwitchChain = async (e: any) => {
    const chainId = Number(e.target.value);
    if (chainId) {
      try {
        await switchChain(chainId);
      } catch (error: any) {
        toast.error(error.message || 'switch chain error');
      }
    }
  };

  const { run: onSendNativeToken, loading: sendTokenLoading } = useRequest(
    async () => {
      if (!smartAccount) {
        throw new Error('Please connect wallet first!');
      }
      const balance = await smartAccount.provider.request({
        method: 'eth_getBalance',
        params: [await smartAccount.getAddress(), 'latest'],
      });
      const value = BigInt(balance) > 100000000n ? '100000000' : '0';
      const tx = {
        to: '0xe8fc0baE43aA264064199dd494d0f6630E692e73',
        value,
        data: '0x',
      };
      const feeQuotes = await smartAccount.getFeeQuotes(tx);
      const { userOp, userOpHash } =
        (gasless && feeQuotes.verifyingPaymasterGasless) || feeQuotes.verifyingPaymasterNative;
      const hash = await smartAccount.sendUserOperation({ userOp, userOpHash });
      return hash;
    },
    {
      manual: true,
      onSuccess: (hash) => {
        toast.success('Send Success!', {
          onClick: () => {
            const chain = chains.getEVMChainInfoById(chainId ?? 0);
            if (chain) {
              window.open(`${chain.blockExplorerUrl}/tx/${hash}`, '_blank');
            }
          },
        });
      },
      onError: (error) => {
        console.log('🚀 ~ onSendNativeToken ~ error:', error);
        toast.error(error.message || 'send token error');
      },
    }
  );

  return (
    <div className="container mx-auto flex h-full flex-col items-center gap-6 overflow-auto py-10">
      <Image src={particleLogo} alt="" className=""></Image>
      <div className="flex items-center gap-3 text-2xl font-bold">
        <Image src={bitcoinIcon} alt="" className="inline h-10 w-10 rounded-full"></Image>
        BTC Connect
      </div>

      <div className=" -skew-x-6">The First Account Abstraction Protocol on Bitcoin</div>

      <div className="absolute right-4 top-4">
        {accounts.length === 0 && (
          <Button color="primary" onClick={openConnectModal}>
            Connect
          </Button>
        )}
        {accounts.length !== 0 && (
          <Button color="primary" onClick={disconnect}>
            Disconnect
          </Button>
        )}
      </div>

      {accounts.length === 0 && (
        <>
          <Divider></Divider>
          <div className="mt-6 flex gap-8">
            {connectors.map((connector) => {
              return (
                connector.isReady() && (
                  <Image
                    key={connector.metadata.id}
                    src={connector.metadata.icon}
                    alt={connector.metadata.name}
                    width={50}
                    height={50}
                    className="cursor-pointer rounded-lg"
                    onClick={() => connect(connector.metadata.id)}
                  ></Image>
                )
              );
            })}
          </div>
        </>
      )}

      <div className="mt-12 flex h-auto w-[40rem] max-w-full flex-col gap-4 rounded-lg p-4 shadow-md">
        <div className="mb-4 text-2xl font-bold">Bitcoin</div>

        <div className="overflow-hidden text-ellipsis whitespace-nowrap">Addresses: {accounts.join(', ')}</div>

        <Button color="primary" onClick={onGetNetwork}>
          Get Network
        </Button>

        <Button color="primary" onClick={onSwitchNetwork}>
          Change Network
        </Button>

        <Button color="primary" onClick={onGetPubkey}>
          Get Pubkey
        </Button>

        <Divider />
        <Input label="Message" value={message} onValueChange={setMessage}></Input>
        <Button color="primary" onClick={onSignMessage}>
          Sign Message
        </Button>

        <Divider />
        <Input label="Address" value={address} onValueChange={setAddress}></Input>
        <Input label="Satoshis" value={satoshis} onValueChange={setSatoshis} inputMode="numeric"></Input>
        <Button color="primary" onClick={onSendBitcoin}>
          Send Bitcoin
        </Button>

        {accounts.length !== 0 && (
          <div className="flex flex-col gap-4">
            <Divider></Divider>
            <Input
              label="Receiver Address"
              value={inscriptionReceiverAddress}
              onValueChange={setInscriptionReceiverAddress}
            ></Input>
            <Input label="Inscription ID" value={inscriptionId} onValueChange={setInscriptionId}></Input>
            <Button color="primary" onClick={onSendInscription}>
              Send Inscription
            </Button>
          </div>
        )}
      </div>

      <div className="mt-20 flex h-auto w-[40rem] max-w-full flex-col gap-4 rounded-lg p-4 shadow-md">
        <div className="mb-4 text-2xl font-bold">EVM</div>

        <div className="overflow-hidden text-ellipsis whitespace-nowrap">Address: {evmAccount}</div>
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">ChainId: {chainId}</div>
        <Select
          label="Switch Chain"
          size="sm"
          selectedKeys={chainId ? [chainId?.toString()] : []}
          onChange={onSwitchChain}
          isRequired
        >
          {accountContracts.BTC[0].chainIds.map((chainId) => {
            const chain = chains.getEVMChainInfoById(chainId)!;
            return (
              <SelectItem key={chain.id} value={chain.id}>
                {chain.fullname}
              </SelectItem>
            );
          })}
        </Select>

        <div className="felx w-full items-center">
          <Button color="primary" onClick={onSendNativeToken} isLoading={sendTokenLoading} className="px-10">
            Send Native Token
          </Button>
          <Checkbox className="ml-4 flex-none" isSelected={gasless} onValueChange={setGasless}>
            Gasless
          </Checkbox>
        </div>
      </div>

      {/* <Link href="/others">Others</Link> */}
    </div>
  );
}
