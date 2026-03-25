import api from "../../../api/client";
import type { CreateProjectRequest } from "../types";

export const getProjectById = (id: string) =>
  api.get(`/projects/${id}`);

export const createProject = (data: CreateProjectRequest) =>
  api.post("/projects", data);

export const getUserProjects = () =>
  api.get(`/projects/my`);

export const getProjectDetails = (projectId: string) =>
  api.get(`/projects/${projectId}`);

export const removeProject = (projectId: string) =>
  api.delete(`/projects/${projectId}`);