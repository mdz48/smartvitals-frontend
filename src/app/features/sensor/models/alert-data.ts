export interface AlertData {
    type: 'alerta';
    patient_id: number;
    doctor_id?: number;
    alertas: string[];
}