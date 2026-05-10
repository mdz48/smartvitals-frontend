import { User } from "../../user/models/user";

export interface RecordWithRisks {
    id: number;
    patient_id: number;
    doctor_id: number;
    temperature: number;
    blood_pressure: string;
    oxygen_saturation: number;
    heart_rate: number;
    diagnosis: string;
    treatment: string;
    notes: string;
    created_at: Date;
    updated_at: Date;
    patient: User;
    doctor: User;
    risks: {
        "hipotermia": boolean;
        "fiebre": boolean;
        "arritmia": boolean;
        "hipoxemia": boolean;
        "hipertension": boolean;
        "hipotension": boolean;
    }
    }