export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    role_id?: string;
    full_name?: string;
    phone?: string;
    department?: string;
    notes?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    email: string;
    username?: string;
    role: string;
    status: string;
    full_name?: string;
}
