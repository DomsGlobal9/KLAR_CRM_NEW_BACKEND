export interface Department {
  id: string;
  name: string;
  description?: string;
  admin_ids: string[];
  team_ids: string[];
  service_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  admin_ids?: string[];
  team_ids?: string[];
  service_ids?: string[];
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
  admin_ids?: string[];
  team_ids?: string[];
  service_ids?: string[];
  is_active?: boolean;
}

export interface EnrichedAdmin {
  id: string;
  email?: string;
  full_name?: string;
  role_name?: string;
}

export interface EnrichedTeam {
  id: string;
  name: string;
  description?: string;
  members_count: number;
}

export interface EnrichedService {
  id: string;
  name: string;
}

export interface EnrichedDepartment extends Department {
  admins: EnrichedAdmin[];
  teams: EnrichedTeam[];
  services: EnrichedService[];
  admin_names: string;
  team_names: string;
  service_names: string;
  admin_count: number;
  team_count: number;
  service_count: number;
}
