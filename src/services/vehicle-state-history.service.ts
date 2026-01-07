import api from './http';

export interface VehicleStateHistoryRecord {
  id: number;
  vehicle: {
    id: number;
    plate: string;
    model: string;
  };
  previousState: number;
  newState: number;
  reason: string;
  createdAt: string;
}

export interface QueryVehicleStateHistoryParams {
  previousState?: number;
  newState?: number;
  fromDate?: string;
  toDate?: string;
}

export const getVehicleStateHistory = async (
  vehicleId: number,
  params?: QueryVehicleStateHistoryParams
): Promise<VehicleStateHistoryRecord[]> => {
  const response = await api.get(`/vehicle-state-history/vehicle/${vehicleId}`, { params });
  return response.data;
};

export const deleteVehicleStateHistoryRecord = async (id: number): Promise<void> => {
  await api.delete(`/vehicle-state-history/${id}`);
};

export const updateVehicleStateHistoryReason = async (
  id: number,
  reason: string
): Promise<VehicleStateHistoryRecord> => {
  const response = await api.patch(`/vehicle-state-history/${id}/reason`, { reason });
  return response.data;
};

const VehicleStateHistoryService = {
  getVehicleStateHistory,
  deleteVehicleStateHistoryRecord,
  updateVehicleStateHistoryReason,
};

export default VehicleStateHistoryService;
