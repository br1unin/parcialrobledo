import { useUIStore } from '@/store/uiStore';

export function ConfirmModal() {
  const { open, message, onConfirm } = useUIStore((s) => s.confirmModal);
  const closeConfirmModal = useUIStore((s) => s.closeConfirmModal);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    closeConfirmModal();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center"
      onClick={closeConfirmModal}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold text-slate-900 mb-6 text-center">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={closeConfirmModal}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
