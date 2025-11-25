export interface OwnerLite {
  id: number;
  identification: string;
  name: string;
}

export interface Owner extends OwnerLite {
  phone: string;
  email: string;
  address: string;
  issuedIn?: string;
  createdAt?: string;
  updatedAt?: string;
}
