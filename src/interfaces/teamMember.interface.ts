export interface CreateTeamMemberPayload {
  username: string;
  email: string;
  password: string;
  role_id: string;
  team_id?: string | null;
  email_verified?: boolean;
}

export interface UpdateTeamMemberPayload {
  role_id?: string;
  team_id?: string | null;
}
