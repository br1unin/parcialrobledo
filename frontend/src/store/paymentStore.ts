import { create } from 'zustand';

type PaymentStatus = 'idle' | 'processing' | 'approved' | 'rejected' | 'error';

type PaymentState = {
  status: PaymentStatus;
  mpPaymentId: string | null;
  statusDetail: string | null;
  setPaymentStatus: (status: PaymentStatus, mpPaymentId?: string | null, statusDetail?: string | null) => void;
  reset: () => void;
};

const initialState = {
  status: 'idle' as const,
  mpPaymentId: null,
  statusDetail: null,
};

export const usePaymentStore = create<PaymentState>((set) => ({
  ...initialState,
  setPaymentStatus: (status, mpPaymentId = null, statusDetail = null) =>
    set({ status, mpPaymentId, statusDetail }),
  reset: () => set(initialState),
}));
