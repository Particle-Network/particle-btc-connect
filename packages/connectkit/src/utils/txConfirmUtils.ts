const txConfirm = {
  isNotRemind: () => {
    if (typeof window === 'undefined') return false;
    const value = localStorage.getItem('tx-confirm-modal-remind');
    return value === '0';
  },
  setNotRemind: (notRemind: boolean) => {
    if (typeof window === 'undefined') return;
    if (notRemind) {
      localStorage.setItem('tx-confirm-modal-remind', '0');
    } else {
      localStorage.removeItem('tx-confirm-modal-remind');
    }
  },
  reset: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('tx-confirm-modal-remind');
  },
};

export default txConfirm;
