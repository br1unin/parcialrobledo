export interface Ingrediente {
  id: string;
  nombre: string;
  es_alergeno: boolean;
  created_at: string;
}

export interface IngredienteCreate {
  nombre: string;
  es_alergeno: boolean;
}

export interface IngredienteUpdate {
  nombre?: string;
  es_alergeno?: boolean;
}

export interface IngredienteListResponse {
  items: Ingrediente[];
  total: number;
  page: number;
  limit: number;
}
