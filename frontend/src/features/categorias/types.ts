export interface CategoriaNode {
  id: string;
  nombre: string;
  descripcion: string | null;
  padre_id: string | null;
  imagen_url: string | null;
  created_at: string;
  children: CategoriaNode[];
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string;
  padre_id?: string;
  imagen_url?: string;
}

export interface CategoriaUpdate {
  nombre?: string;
  descripcion?: string;
  padre_id?: string;
  imagen_url?: string;
}
