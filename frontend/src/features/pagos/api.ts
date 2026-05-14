import { axiosInstance } from '@/shared/api/axiosInstance';

import type { PreferenceResponse } from './types';

export const pagosApi = {
  createPreference: (pedido_id: string): Promise<PreferenceResponse> =>
    axiosInstance
      .post<PreferenceResponse>('/api/v1/pagos/preference', { pedido_id })
      .then((r) => r.data),
};
