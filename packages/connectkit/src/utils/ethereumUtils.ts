import { bytesToHex, publicToAddress, toBytes, toChecksumAddress, toRpcSig } from '@ethereumjs/util';
import bitcore from 'bitcore-lib';

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
