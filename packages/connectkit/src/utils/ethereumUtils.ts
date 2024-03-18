import { bytesToHex, publicToAddress, toBytes, toChecksumAddress, toRpcSig } from '@ethereumjs/util';
import type { SmartAccount, UserOp } from '@particle-network/aa';
import bitcore from 'bitcore-lib';
import type { BtcVersion } from '../context';

export const pubKeyToEVMAddress = (pubKey: string) => {
  const address = toChecksumAddress(bytesToHex(publicToAddress(toBytes(`0x${pubKey}`), true)));
  return address;
};

export const convertSignature = (signature: string) => {
  const sig = (bitcore.crypto.Signature as any).fromCompact(Buffer.from(signature, 'base64'));
  const v = BigInt(sig.i + 27);
  const evmSig = toRpcSig(v, sig.r.toBuffer(), sig.s.toBuffer());
  return evmSig;
};

export function caculateNativeFee(userOp: UserOp): bigint {
  return (
    (BigInt(userOp.callGasLimit) + BigInt(userOp.verificationGasLimit) + BigInt(userOp.preVerificationGas)) *
    BigInt(userOp.maxFeePerGas)
  );
}

export const getBTCAAAddress = async (
  smartAccount: SmartAccount,
  btcAddress: string,
  btcVersion: BtcVersion
): Promise<string> => {
  const addresses = await smartAccount.provider.request({ method: 'eth_accounts' });
  const owner = addresses[0];
  const localKey = `particle_BTC_${btcVersion}_${owner}`;
  if (typeof window !== 'undefined' && localStorage) {
    const localAA = localStorage.getItem(localKey);
    if (localAA) {
      return localAA;
    }
  }

  const btcPublicKey = await (smartAccount.provider as any).getPublicKey();
  const publicClient = (smartAccount.provider as any).publicClient;
  const accountInfo = await publicClient.request({
    method: 'particle_aa_getBTCAccount' as any,
    params: [
      {
        name: 'BTC',
        version: btcVersion,
        btcPublicKey,
        btcAddress,
      } as any,
    ],
  });
  const address = (accountInfo as any)?.[0]?.smartAccountAddress;

  if (typeof window !== 'undefined' && localStorage && address) {
    localStorage.setItem(localKey, address);
  }
  return address;
};
