export type UserResponse = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[];
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
};
