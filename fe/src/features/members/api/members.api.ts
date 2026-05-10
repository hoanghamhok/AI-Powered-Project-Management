import api from "../../../api/client"
export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER";

export const getProjectMembers = (projectId: string) =>
  api.get(`/projectmembers/${projectId}/members`);

export const removeMember = (projectId: string, userId: string) =>
  api.delete(`/projectmembers/${projectId}/members/${userId}`);

export const leaveProject = (projectId: string) =>
  api.post(`/projectmembers/${projectId}/leave`);

export const setRoleMember = (projectId:string,targetUserId:string,role: ProjectRole) => {
  return api.patch(`/projectmembers/${projectId}/members/${targetUserId}/role`,{role})
}
