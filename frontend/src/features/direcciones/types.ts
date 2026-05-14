export interface DireccionEntrega {
  id: string;
  calle: string;
  numero: string;
  departamento: string | null;
  comuna: string;
  ciudad: string;
  codigo_postal: string | null;
  es_principal: boolean;
  created_at: string;
}

export interface DireccionCreate {
  calle: string;
  numero: string;
  departamento?: string;
  comuna: string;
  ciudad: string;
  codigo_postal?: string;
}

export interface DireccionUpdate {
  calle?: string;
  numero?: string;
  departamento?: string;
  comuna?: string;
  ciudad?: string;
  codigo_postal?: string;
}
