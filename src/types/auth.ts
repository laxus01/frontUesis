export interface Company {
  id: string;
  name: string;
  nit: string;
  phone: string;
  address: string;
  contractual: string;
  extraContractual: string;
  contractualExpires: string;
  extraContractualExpires: string;
}

export interface User {
  id: string;
  name: string;
  user: string;
  permissions: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  company: Company;
}

export interface AuthData {
  token: string;
  user: User;
}
