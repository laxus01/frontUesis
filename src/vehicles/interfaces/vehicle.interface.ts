export interface Vehicle {
    id: number;
    plate: string;
    model: string;
    internalNumber: string;
    mobileNumber?: string;
    engineNumber?: string;
    chassisNumber?: string;
    line?: string;
    entryDate?: string;
    createdAt?: string;
    state: number;
    make: {
        id: number;
        name: string;
    };
    insurer: {
        id: number;
        name: string;
    };
    communicationCompany: {
        id: number;
        name: string;
    };
    owner: {
        id: number;
        name: string;
        identification: string;
        email?: string;
        address?: string;
        phone?: string;
        createdAt?: string;
    };
    company: {
        id: number;
        nit: string;
        name: string;
        phone?: string;
        address?: string;
        createdAt?: string;
    };
}
