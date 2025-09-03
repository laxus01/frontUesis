export interface Company {
  id: number;
  name: string;
  [key: string]: any;
}

export interface User {
  id: number;
  user: string;
  email: string;
  company: Company;
  [key: string]: any;
}

export interface AuthData {
  token: string;
  user: User;
}
