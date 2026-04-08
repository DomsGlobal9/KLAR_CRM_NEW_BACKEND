export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    role: 'superadmin' | 'admin' | 'rm';
    status: 'active' | 'inactive' | 'suspended';
    full_name?: string;
    phone?: string;
    department?: string;
    notes?: string;
    created_by?: string;
    assigned_under?: string;
    assigned_leads_count: number;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;

}

export interface CreateUserInput {
    username: string;
    email: string;
    password_hash: string;
    role: 'superadmin' | 'admin' | 'rm';
    full_name?: string;
    phone?: string;
    department?: string;
    created_by?: string;
    assigned_under?: string;
}

export interface UpdateUserInput {
    full_name?: string;
    phone?: string;
    profile_image_url?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'suspended';
    assigned_under?: string;
    notes?: string;
    last_login_at?: Date;
    role?:string;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string; 
}

export interface AdminRMAssignment {
    id: string;
    admin_id: string;
    rm_id: string;
    assigned_by?: string;
    status: 'active' | 'inactive';
    assigned_at: Date;
}

export interface AuditLog {
    id: string;
    user_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: Date;
}





