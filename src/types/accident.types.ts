export interface AccidentVehicle {
  id: number;
  plate: string;
  model: string;
  make?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    name: string;
    lastName: string;
    identification: string;
    phone: string;
    email: string;
    address: string;
  };
}

export interface Accident {
  id: number;
  vehicleId: number;
  accidentDate: string;
  detail: string;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: AccidentVehicle;
}

export interface CreateAccidentPayload {
  vehicleId: number;
  accidentDate: string;
  detail: string;
}

export interface UpdateAccidentPayload {
  vehicleId?: number;
  accidentDate?: string;
  detail?: string;
}

export interface AccidentFilters {
  vehicleId?: number;
  startDate?: string;
  endDate?: string;
}
