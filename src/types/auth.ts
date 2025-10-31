export interface Company {
  id: string;
  name: string;
  nit: string;
  phone: string;
  address: string;
}

export interface Policy {
  id: number;
  insurerId: number;
  insurerName: string;
  contractual: string;
  contractualExpires: string;
  extraContractual: string;
  extraContractualExpires: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  user: string;
  permissions: 'SUPER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
  company: Company;
  policy: Policy;
}

export interface AuthData {
  token: string;
  user: User;
}
