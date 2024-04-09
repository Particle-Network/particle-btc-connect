import type { AAOptions } from '@particle-network/aa';

export function shortString(str: any): string {
  if (Array.isArray(str)) {
    str = '[' + str.toString() + ']';
  }
  if (str) {
    if (typeof str.toString === 'function') {
      str = str.toString();
    }
    if (str.length <= 10) {
      return str;
    }
    return `${str.slice(0, 5)}...${str.slice(str.length - 5, str.length)}`;
  }
  return '';
}

/**
 * 复制到剪贴板
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text: string) {
  const clipboardCopy = async () => {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);

      textarea.select();
      const result = document.execCommand('copy');

      document.body.removeChild(textarea);

      if (!result) {
        throw new Error('Copy to clipboard failed');
      }
    }
  };

  return new Promise((resolve, reject) => {
    clipboardCopy().then(resolve).catch(reject);
  });
}

export const defaultTokenIcon = 'https://static.particle.network/token-list/defaultToken/default.png';

export const ipfsToSrc = (ipfs: string) => {
  if (!ipfs || !ipfs.startsWith('ipfs://')) {
    return ipfs || '';
  }

  return `https://ipfs.particle.network/${encodeURI(ipfs.slice(7))}`;
};

export const checkBTCVersion = (
  accountContracts: AAOptions['accountContracts'],
  accountContractKey: string,
  version: string
) => {
  if (!accountContracts[accountContractKey]) {
    return false;
  }
  return accountContracts[accountContractKey].some((item) => item.version === version);
};
