import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { Observable, from } from 'rxjs';
import { RecordWithRisks } from './models/record-with-risks';
import { EMAIL_CONFIG } from './email.config';

@Injectable({
    providedIn: 'root'
})
export class EmailService {

    constructor() {
        // Inicializar EmailJS con tu clave pública
        emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
    }

    /**
     * Envía un expediente médico por correo electrónico
     * @param record El expediente médico con sus riesgos
     * @param toEmail Correo electrónico del destinatario
     * @param customMessage Mensaje personalizado (opcional)
     * @returns Observable que resuelve cuando se envía el correo
     */
    sendMedicalRecordByEmail(record: RecordWithRisks, toEmail: string, customMessage?: string): Observable<any> {
        return from(this.sendEmail(record, toEmail, customMessage));
    }

    private async sendEmail(record: RecordWithRisks, toEmail: string, customMessage?: string): Promise<any> {
        try {
            // Preparar los datos para la plantilla
            const templateParams = {
                to_email: toEmail,
                from_name: 'SmartVitals',
                subject: `Expediente Médico #${record.id} - ${record.patient.name} ${record.patient.lastname}`,

                // Datos del expediente
                record_id: record.id,
                patient_name: `${record.patient.name} ${record.patient.lastname}`,
                patient_email: record.patient.email,
                patient_id: record.patient.id,

                doctor_name: record.doctor ? `${record.doctor.name} ${record.doctor.lastname}` : 'No asignado',
                doctor_email: record.doctor ? record.doctor.email : 'N/A',
                doctor_id: record.doctor ? record.doctor.id : 'N/A',

                created_date: new Date(record.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),

                // Signos vitales
                temperature: record.temperature,
                blood_pressure: record.blood_pressure,
                oxygen_saturation: record.oxygen_saturation,
                heart_rate: record.heart_rate,

                // Información médica
                diagnosis: record.diagnosis || 'No especificado',
                treatment: record.treatment || 'No especificado',
                notes: record.notes || 'Sin notas adicionales',

                // Riesgos individuales con texto amigable
                risk_hipotermia: record.risks?.hipotermia ? '🔴 SÍ - Detectado' : '🟢 No detectado',
                risk_fiebre: record.risks?.fiebre ? '🔴 SÍ - Detectado' : '🟢 No detectado',
                risk_arritmia: record.risks?.arritmia ? '🔴 SÍ - Detectado' : '🟢 No detectado',
                risk_hipoxemia: record.risks?.hipoxemia ? '🔴 SÍ - Detectado' : '🟢 No detectado',
                risk_hipertension: record.risks?.hipertension ? '🔴 SÍ - Detectado' : '🟢 No detectado',
                risk_hipotension: record.risks?.hipotension ? '🔴 SÍ - Detectado' : '🟢 No detectado',

                // Mensaje personalizado
                custom_message: customMessage || 'Se adjunta la información completa del expediente médico.',

                // Fecha de envío
                sent_date: new Date().toLocaleString('es-ES')
            };            // Enviar el correo usando EmailJS
            const response = await emailjs.send(
                EMAIL_CONFIG.SERVICE_ID,
                EMAIL_CONFIG.TEMPLATE_ID,
                templateParams
            );

            console.log('Correo enviado exitosamente:', response);
            return response;

        } catch (error) {
            console.error('Error al enviar el correo:', error);
            throw error;
        }
    }

    private generateRisksHTML(risks: any): string {
        const riskItems = [
            { key: 'hipotermia', label: '❄️ Hipotermia', color: '#17a2b8' },
            { key: 'fiebre', label: '🔥 Fiebre', color: '#dc3545' },
            { key: 'arritmia', label: '💔 Arritmia', color: '#6f42c1' },
            { key: 'hipoxemia', label: '🫁 Hipoxemia', color: '#fd7e14' },
            { key: 'hipertension', label: '📈 Hipertensión', color: '#e83e8c' },
            { key: 'hipotension', label: '📉 Hipotensión', color: '#20c997' }
        ];

        const activeBadges = riskItems
            .filter(item => risks[item.key])
            .map(item => `
        <span style="background: ${item.color}; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 500; margin: 2px; display: inline-block;">
          ${item.label}
        </span>
      `);

        if (activeBadges.length === 0) {
            return `
        <span style="background: #28a745; color: white; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 500; display: inline-block;">
          ✅ Sin riesgos detectados
        </span>
      `;
        }

        return activeBadges.join('');
    }

    private hasRisks(risks: any): boolean {
        return Object.values(risks).some(risk => risk === true);
    }

    private generateCompleteRecordHTML(record: RecordWithRisks): string {
        const createdDate = new Date(record.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">SmartVitals</h1>
          <h2 style="margin: 10px 0; font-size: 20px;">Expediente Médico #${record.id}</h2>
          <p style="margin: 5px 0; opacity: 0.9;">Generado el: ${createdDate}</p>
        </div>

        <!-- Patient and Doctor Info -->
        <div style="padding: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
          <!-- Patient Info -->
          <div style="flex: 1; min-width: 300px; background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 5px solid #4CAF50;">
            <h3 style="color: #2e7d32; margin-top: 0; font-size: 18px;">👤 Información del Paciente</h3>
            <p style="margin: 8px 0;"><strong>Nombre:</strong> ${record.patient.name} ${record.patient.lastname}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${record.patient.email}</p>
            <p style="margin: 8px 0;"><strong>ID Paciente:</strong> #${record.patient.id}</p>
          </div>

          <!-- Doctor Info -->
          ${record.doctor ? `
          <div style="flex: 1; min-width: 300px; background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 5px solid #2196F3;">
            <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">👨‍⚕️ Doctor Asignado</h3>
            <p style="margin: 8px 0;"><strong>Nombre:</strong> ${record.doctor.name} ${record.doctor.lastname}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${record.doctor.email}</p>
            <p style="margin: 8px 0;"><strong>ID Doctor:</strong> #${record.doctor.id}</p>
          </div>
          ` : `
          <div style="flex: 1; min-width: 300px; background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0; font-size: 18px;">👨‍⚕️ Doctor</h3>
            <p style="margin: 8px 0; color: #856404;">No asignado</p>
          </div>
          `}
        </div>

        <!-- Vital Signs -->
        <div style="margin: 20px; background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 5px solid #17a2b8;">
          <h3 style="color: #0c5460; margin-top: 0; font-size: 20px;">💓 Signos Vitales</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
              <h4 style="color: #dc3545; margin: 0 0 8px 0;">🌡️ Temperatura</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.temperature}°C</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
              <h4 style="color: #007bff; margin: 0 0 8px 0;">🩸 Presión Arterial</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.blood_pressure} mmHg</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
              <h4 style="color: #28a745; margin: 0 0 8px 0;">🫁 Saturación O2</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.oxygen_saturation}%</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
              <h4 style="color: #fd7e14; margin: 0 0 8px 0;">❤️ Frecuencia Cardíaca</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.heart_rate} bpm</p>
            </div>
          </div>
        </div>

        <!-- Risk Assessment -->
        <div style="margin: 20px; background: #fff3cd; padding: 25px; border-radius: 8px; border-left: 5px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0; font-size: 20px;">⚠️ Evaluación de Riesgos</h3>
          <div style="margin-top: 15px;">
            ${this.generateRisksHTML(record.risks)}
          </div>
        </div>

        <!-- Medical Information -->
        <div style="margin: 20px;">
          <!-- Diagnosis -->
          ${record.diagnosis ? `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #00bcd4;">
            <h3 style="color: #006064; margin-top: 0; font-size: 18px;">🏥 Diagnóstico</h3>
            <p style="margin-bottom: 0; white-space: pre-wrap; line-height: 1.6;">${record.diagnosis}</p>
          </div>
          ` : ''}

          <!-- Treatment -->
          ${record.treatment ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #4caf50;">
            <h3 style="color: #2e7d32; margin-top: 0; font-size: 18px;">💊 Tratamiento</h3>
            <p style="margin-bottom: 0; white-space: pre-wrap; line-height: 1.6;">${record.treatment}</p>
          </div>
          ` : ''}

          <!-- Notes -->
          ${record.notes ? `
          <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 5px solid #ff9800;">
            <h3 style="color: #ef6c00; margin-top: 0; font-size: 18px;">📝 Notas Adicionales</h3>
            <p style="margin-bottom: 0; white-space: pre-wrap; line-height: 1.6;">${record.notes}</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-radius: 0 0 10px 10px; border-top: 1px solid #dee2e6;">
          <p style="margin: 5px 0;">Este documento fue generado automáticamente por SmartVitals</p>
          <p style="margin: 5px 0;">Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} SmartVitals - Sistema de Monitoreo Médico</p>
        </div>
      </div>
    `;
    }
}
