export interface CreateTeamMemberPayload {
  username: string;
  email: string;
  password: string;
  role_id: string;
  team_id?: string | null;
}

export interface UpdateTeamMemberPayload {
  role_id?: string;
  team_id?: string | null;
}
