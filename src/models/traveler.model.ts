// Title enum
export enum Title {
    MR = "Mr",
    MRS = "Mrs",
    MS = "Ms",
    MISS = "Miss",
    MASTER = "Master",
    MSTR = "Master"
}

// Passport interface
export interface IPassport {
    passportNumber: string;
    nationality: string;
    issueDate: Date;
    expiryDate: Date;
}

// GST interface
export interface IGST {
    gstNumber: string;
    registeredName: string;
    email: string;
    mobile: string;
    address: string;
}

// Emergency contact interface
export interface IEmergencyContact {
    contactName: string;
    email: string;
    phoneNumber: string;
}

// Main Traveler Interface
export interface ITraveler {
    id: string;
    title: Title;
    travelerName: string;
    travelerPhone: string;
    travelerEmail: string;
    dateOfBirth: Date;
    passport?: IPassport;
    gst?: IGST;
    emergencyContact: IEmergencyContact;
    created_at: Date;
    updated_at: Date;
}

// Create Traveler Payload
export interface CreateTravelerPayload {
    title: Title;
    travelerName: string;
    travelerPhone: string;
    travelerEmail: string;
    dateOfBirth: Date;
    passport?: IPassport;
    gst?: IGST;
    emergencyContact: IEmergencyContact;
}

// Update Traveler Payload
export interface UpdateTravelerPayload {
    title?: Title;
    travelerName?: string;
    travelerPhone?: string;
    travelerEmail?: string;
    dateOfBirth?: Date;
    passport?: IPassport;
    gst?: IGST;
    emergencyContact?: IEmergencyContact;
}

// Traveler Filter
export interface TravelerFilter {
    search?: string;
    title?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

export interface AdvancedTravelerFilter {
    filters?: {
        title?: string | string[];
        travelerName?: string;
        travelerEmail?: string;
        travelerPhone?: string;
        dateOfBirthFrom?: string;
        dateOfBirthTo?: string;
        createdFrom?: string;
        createdTo?: string;
        hasPassport?: boolean;
        hasGST?: boolean;
        nationality?: string;
    };
    sort?: {
        field: 'title' | 'travelerName' | 'travelerEmail' | 'dateOfBirth' | 'created_at' | 'updated_at';
        order: 'asc' | 'desc';
    };
    pagination?: {
        page: number;
        limit: number;
    };
}