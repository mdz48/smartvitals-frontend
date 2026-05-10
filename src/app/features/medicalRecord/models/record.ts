import { User } from "../../user/models/user";

export interface Record {
    patient_id:        number;
    doctor_id:         number | null;
    temperature:       number;
    blood_pressure:    number;
    oxygen_saturation: number;
    heart_rate:        number;
    diagnosis:         string;
    treatment:         string;
    notes:             string;
    id:                number;
    created_at:        Date;
    updated_at:        Date;
    deleted:           null;
    doctor:            User | null;
    patient:           User;
  }