import api from './http';

type UploadResponse = { filename: string; path: string };

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<UploadResponse>('/uploads', form);
  const data = res.data;
  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  const path = data.path.startsWith('/') ? data.path : `/${data.path}`;
  const url = `${base}${path}`;
  return { url, filename: data.filename };
}

export async function deleteFile(filename: string): Promise<void> {
  if (!filename) return;
  await api.delete(`/uploads/${encodeURIComponent(filename)}`);
}

export default { uploadFile, deleteFile };
