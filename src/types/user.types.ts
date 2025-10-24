export type UserPermission = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface UserCompany {
  id: number;
  nit: string;
  name: string;
  phone: string;
  address: string;
  contractual: string;
  contractualExpires: string;
  extraContractual: string;
  extraContractualExpires: string;
  createdAt: string;
}

export interface SystemUser {
  id?: number;
  user: string;
  name: string;
  permissions: UserPermission;
  companyId?: number;
  company?: UserCompany;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  user: string;
  password: string;
  permissions: UserPermission;
  name: string;
  companyId: number;
}

export interface UpdateUserPayload {
  name: string;
  user: string;
  password?: string;
  permissions: UserPermission;
  companyId: number;
}

export const PERMISSION_LABELS: Record<UserPermission, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  VIEWER: 'Visualizador'
};
