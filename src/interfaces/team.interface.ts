export interface Team {
  id: string;
  name: string;
  description?: string;
  members_count: number;
  is_active: boolean; 
  service_ids: string[];
  created_at: string;
  updated_at: string;
}
