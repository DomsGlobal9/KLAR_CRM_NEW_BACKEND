export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  is_system: boolean;
  assigned_people: number;
  created_by: string;
}
