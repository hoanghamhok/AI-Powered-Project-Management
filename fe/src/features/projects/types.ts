import type { paths } from "../../types/openapi"

export type CreateProjectRequest =
  paths["/projects"]["post"]["requestBody"]["content"]["application/json"];

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  ownerId: string;
}

export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER";

export type SystemRole = "SUPER_ADMIN" | "USER";

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  project: Project;
}
