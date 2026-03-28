export interface UpdateSelfPayload {
    username?: string;
    full_name?: string;
    email?: string;
    image?: string;
    phone?: string;
    department?: string;
    notes?: string;
}

export interface UserMetadata {
    username: string;
    role_id: string;
    role_name: string;
    team_id?: string | null;
    full_name?: string | null;
    phone?: string | null;
    department?: string | null;
    notes?: string | null;
    status: 'active' | 'inactive';
    created_by?: string | null;
    assigned_under?: string | null;
    assigned_leads_count: number;
    last_login_at?: string | null;
}