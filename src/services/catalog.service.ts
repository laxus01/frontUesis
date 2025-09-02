import api from './http';

export interface Option { id: number; name: string }
export interface CreateOwnerPayload {
  name: string;
  identification: string;
  email?: string;
  address?: string;
  phone: string;
}
export interface Catalogs {
  makes: Option[];
  insurers: Option[];
  communicationCompanies: Option[];
  owners: Option[];
  eps: Option[];
  arls: Option[];
}

const STORAGE_KEY = 'catalogs';

export const getCatalogsFromStorage = (): Catalogs | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.makes) &&
      Array.isArray(parsed.insurers) &&
      Array.isArray(parsed.communicationCompanies) &&
      Array.isArray(parsed.owners)
    ) {
      // Backward compatibility: default missing arrays
      if (!Array.isArray(parsed.eps)) parsed.eps = [];
      if (!Array.isArray(parsed.arls)) parsed.arls = [];
      return parsed as Catalogs;
    }
    return null;
  } catch {
    return null;
  }
};

// Create endpoints for each catalog entity
export const createMake = async (name: string): Promise<Option> => {
  const res = await api.post<Option>('/make', { name });
  const created = res.data;
  const current = getCatalogsFromStorage() || { makes: [], insurers: [], communicationCompanies: [], owners: [], eps: [], arls: [] };
  const updated = { ...current, makes: [...current.makes, created] };
  saveCatalogsToStorage(updated);
  return created;
};

export const createInsurer = async (name: string): Promise<Option> => {
  const res = await api.post<Option>('/insurer', { name });
  const created = res.data;
  const current = getCatalogsFromStorage() || { makes: [], insurers: [], communicationCompanies: [], owners: [], eps: [], arls: [] };
  const updated = { ...current, insurers: [...current.insurers, created] };
  saveCatalogsToStorage(updated);
  return created;
};

export const createCommunicationCompany = async (name: string): Promise<Option> => {
  const res = await api.post<Option>('/communication-company', { name });
  const created = res.data;
  const current = getCatalogsFromStorage() || { makes: [], insurers: [], communicationCompanies: [], owners: [], eps: [], arls: [] };
  const updated = { ...current, communicationCompanies: [...current.communicationCompanies, created] };
  saveCatalogsToStorage(updated);
  return created;
};

export const createOwner = async (payload: CreateOwnerPayload): Promise<Option> => {
  const res = await api.post('/owner', payload);
  const created = { id: res.data.id, name: res.data.name } as Option;
  const current = getCatalogsFromStorage() || { makes: [], insurers: [], communicationCompanies: [], owners: [], eps: [], arls: [] };
  const updated = { ...current, owners: [...current.owners, created] };
  saveCatalogsToStorage(updated);
  return created;
};

export const createEps = async (name: string): Promise<Option> => {
  const res = await api.post<Option>('/eps', { name });
  const created = res.data;
  const current = getCatalogsFromStorage() || { makes: [], insurers: [], communicationCompanies: [], owners: [], eps: [], arls: [] };
  const updated = { ...current, eps: [...current.eps, created] };
  saveCatalogsToStorage(updated);
  return created;
};

export const createArl = async (name: string): Promise<Option> => {
  const res = await api.post<Option>('/arl', { name });
  const created = res.data;
  const current = getCatalogsFromStorage() || { makes: [], insurers: [], communicationCompanies: [], owners: [], eps: [], arls: [] };
  const updated = { ...current, arls: [...current.arls, created] };
  saveCatalogsToStorage(updated);
  return created;
};

export const saveCatalogsToStorage = (data: Catalogs) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const fetchCatalogs = async (token?: string): Promise<Catalogs> => {
  // Interceptor añadirá Authorization automáticamente si existe en localStorage.
  // Si se provee token explícito, se enviará en headers (tendrá prioridad sobre el interceptor).
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const [mks, ins, comm, own, eps, arl] = await Promise.all([
    api.get<Option[]>(`/make`, { headers }),
    api.get<Option[]>(`/insurer`, { headers }),
    api.get<Option[]>(`/communication-company`, { headers }),
    api.get<Option[]>(`/owner`, { headers }),
    api.get<Option[]>(`/eps`, { headers }),
    api.get<Option[]>(`/arl`, { headers }),
  ]);
  const catalogs: Catalogs = {
    makes: mks.data || [],
    insurers: ins.data || [],
    communicationCompanies: comm.data || [],
    owners: own.data || [],
    eps: eps.data || [],
    arls: arl.data || [],
  };
  saveCatalogsToStorage(catalogs);
  return catalogs;
};

const CatalogService = {
  getCatalogsFromStorage,
  saveCatalogsToStorage,
  fetchCatalogs,
  createMake,
  createInsurer,
  createCommunicationCompany,
  createOwner,
  createEps,
  createArl,
};

export default CatalogService;
