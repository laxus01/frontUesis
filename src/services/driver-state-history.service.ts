import api from './http';

export interface DriverStateHistoryRecord {
  id: number;
  driver: {
    id: number;
    firstName: string;
    lastName: string;
    identification: string;
  };
  previousState: number;
  newState: number;
  reason: string;
  createdAt: string;
}

export interface QueryDriverStateHistoryParams {
  previousState?: number;
  newState?: number;
  fromDate?: string;
  toDate?: string;
}

export const getDriverStateHistory = async (
  driverId: number,
  params?: QueryDriverStateHistoryParams
): Promise<DriverStateHistoryRecord[]> => {
  const response = await api.get(`/driver-state-history/driver/${driverId}`, { params });
  return response.data;
};

export const deleteDriverStateHistoryRecord = async (id: number): Promise<void> => {
  await api.delete(`/driver-state-history/${id}`);
};

export const updateDriverStateHistoryReason = async (
  id: number,
  reason: string
): Promise<DriverStateHistoryRecord> => {
  const response = await api.patch(`/driver-state-history/${id}/reason`, { reason });
  return response.data;
};

const DriverStateHistoryService = {
  getDriverStateHistory,
  deleteDriverStateHistoryRecord,
  updateDriverStateHistoryReason,
};

export default DriverStateHistoryService;
