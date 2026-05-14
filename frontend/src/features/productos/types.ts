export interface CategoriaBasic {
  id: string;
  nombre: string;
}

export interface IngredienteEnProducto {
  id: string;
  nombre: string;
  es_alergeno: boolean;
  es_removible: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock_cantidad: number;
  disponible: boolean;
  imagen_url: string | null;
  created_at: string;
  categorias: CategoriaBasic[];
  ingredientes: IngredienteEnProducto[];
}

export interface ProductoCreate {
  nombre: string;
  precio: number;
  stock_cantidad?: number;
  disponible?: boolean;
  descripcion?: string;
  imagen_url?: string;
}

export interface ProductoUpdate {
  nombre?: string;
  precio?: number;
  stock_cantidad?: number;
  disponible?: boolean;
  descripcion?: string;
  imagen_url?: string;
}

export interface ProductoListResponse {
  items: Producto[];
  total: number;
  page: number;
  limit: number;
}

export interface IngredienteAsignado {
  ingrediente_id: string;
  es_removible: boolean;
}
