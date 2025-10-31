export interface Policy {
  id: number;
  insurerId: number;
  companyId: number;
  contractual: string;
  contractualExpires: string;
  extraContractual: string;
  extraContractualExpires: string;
  state: number;
  createdAt: string;
  insurer?: {
    id: number;
    name: string;
    nit: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface CreatePolicyPayload {
  insurerId: number;
  contractual: string;
  contractualExpires: string;
  extraContractual: string;
  extraContractualExpires: string;
}

export interface UpdatePolicyPayload {
  insurerId?: number;
  contractual?: string;
  contractualExpires?: string;
  extraContractual?: string;
  extraContractualExpires?: string;
}

export interface Insurer {
  id: number;
  name: string;
  nit: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}
