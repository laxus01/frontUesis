export interface Driver {
  id: number;
  identification: string;
  issuedIn: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  license: string;
  category: string;
  expiresOn: string;
  bloodType: string;
  photo: string;
  epsId: number;
  arlId: number;
  state: number;
  eps?: { id: number; name: string };
  arl?: { id: number; name: string };
}
