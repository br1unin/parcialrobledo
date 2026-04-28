import { create } from 'zustand';

type ConfirmModalState = {
  open: boolean;
  message: string;
  onConfirm: (() => void) | null;
};

type UIState = {
  cartOpen: boolean;
  sidebarOpen: boolean;
  confirmModal: ConfirmModalState;
  openCart: () => void;
  closeCart: () => void;
  toggleSidebar: () => void;
  openConfirmModal: (message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
};

const closedConfirmModal: ConfirmModalState = {
  open: false,
  message: '',
  onConfirm: null,
};

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  sidebarOpen: false,
  confirmModal: closedConfirmModal,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openConfirmModal: (message, onConfirm) =>
    set({ confirmModal: { open: true, message, onConfirm } }),
  closeConfirmModal: () => set({ confirmModal: closedConfirmModal }),
}));
