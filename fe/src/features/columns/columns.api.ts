import api from "../../api/client"

export const fetchColumnsByProject = (id:string) => api.get(`/columns/project/${id}`)
export const createColumn = (data: { title: string;projectId:string }) =>
  api.post("/columns/project", data);
export const updateColumn = (id: string, data: { title?: string }) =>
  api.patch(`/columns/${id}`, data);
export const deleteColumn = (id: string) =>
  api.delete(`/columns/${id}`);
export const moveColumn = (
  id: string,
  data: { beforeColumnId?: string; afterColumnId?: string }
) => api.patch(`/columns/${id}/move`, data);
export const markColumnAsDone = (id: string):Promise<void> =>
  api.patch(`/columns/${id}`, { closed: true });