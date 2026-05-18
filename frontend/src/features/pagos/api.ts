import { axiosInstance } from '@/shared/api/axiosInstance';

import type { EfectivoResponse, PreferenceResponse, TransferenciaResponse } from './types';

export const pagosApi = {
  createPreference: (pedido_id: string): Promise<PreferenceResponse> =>
    axiosInstance
      .post<PreferenceResponse>('/api/v1/pagos/preference', { pedido_id })
      .then((r) => r.data),

  pagarEfectivo: (pedido_id: string): Promise<EfectivoResponse> =>
    axiosInstance
      .post<EfectivoResponse>('/api/v1/pagos/efectivo', { pedido_id })
      .then((r) => r.data),

  pagarTransferencia: (pedido_id: string): Promise<TransferenciaResponse> =>
    axiosInstance
      .post<TransferenciaResponse>('/api/v1/pagos/transferencia', { pedido_id })
      .then((r) => r.data),
};
