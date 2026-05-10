import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RecordWithRisks } from './models/record-with-risks';

@Injectable({
    providedIn: 'root'
})
export class PdfGeneratorService {

    constructor() { }

    async generateRecordPDF(record: RecordWithRisks): Promise<void> {
        // Crear el HTML del PDF
        const htmlContent = this.createRecordHTML(record);

        // Crear un elemento temporal en el DOM
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '210mm'; // Ancho A4
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(tempDiv);

        try {
            // Convertir HTML a canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 794, // A4 width in pixels at 96 DPI
                height: 1123 // A4 height in pixels at 96 DPI
            });

            // Crear PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Agregar primera página
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Agregar páginas adicionales si es necesario
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Descargar PDF
            pdf.save(`expediente-${record.id}-${new Date().toISOString().split('T')[0]}.pdf`);

        } finally {
            // Limpiar elemento temporal
            document.body.removeChild(tempDiv);
        }
    }

    private createRecordHTML(record: RecordWithRisks): string {
        const createdDate = new Date(record.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
      <div style="padding: 40px; font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; font-size: 28px; margin: 0;">SmartVitals</h1>
          <h2 style="color: #34495e; font-size: 22px; margin: 10px 0;">Expediente Médico</h2>
          <p style="color: #7f8c8d; font-size: 16px; margin: 5px 0;">Expediente #${record.id}</p>
          <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0;">Generado el: ${createdDate}</p>
        </div>

        <!-- Patient and Doctor Info -->
        <div style="display: flex; margin-bottom: 30px;">
          <!-- Patient Info -->
          <div style="flex: 1; margin-right: 20px; background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 5px solid #4CAF50;">
            <h3 style="color: #2e7d32; margin-top: 0; font-size: 18px;">👤 Información del Paciente</h3>
            <p><strong>Nombre:</strong> ${record.patient.name} ${record.patient.lastname}</p>
            <p><strong>Email:</strong> ${record.patient.email}</p>
            <p><strong>ID Paciente:</strong> #${record.patient.id}</p>
          </div>

          <!-- Doctor Info -->
          ${record.doctor ? `
          <div style="flex: 1; margin-left: 20px; background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 5px solid #2196F3;">
            <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">👨‍⚕️ Doctor Asignado</h3>
            <p><strong>Nombre:</strong> ${record.doctor.name} ${record.doctor.lastname}</p>
            <p><strong>Email:</strong> ${record.doctor.email}</p>
            <p><strong>ID Doctor:</strong> #${record.doctor.id}</p>
          </div>
          ` : ''}
        </div>

        <!-- Vital Signs -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #17a2b8;">
          <h3 style="color: #0c5460; margin-top: 0; font-size: 20px;">💓 Signos Vitales</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h4 style="color: #dc3545; margin: 0 0 8px 0;">🌡️ Temperatura</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.temperature}°C</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h4 style="color: #007bff; margin: 0 0 8px 0;">🩸 Presión Arterial</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.blood_pressure} mmHg</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h4 style="color: #28a745; margin: 0 0 8px 0;">🫁 Saturación O2</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.oxygen_saturation}%</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h4 style="color: #fd7e14; margin: 0 0 8px 0;">❤️ Frecuencia Cardíaca</h4>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #343a40;">${record.heart_rate} bpm</p>
            </div>
          </div>
        </div>

        <!-- Risk Assessment -->
        <div style="background: #fff3cd; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0; font-size: 20px;">⚠️ Evaluación de Riesgos</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${this.generateRiskBadges(record.risks)}
          </div>
        </div>

        <!-- Medical Information -->
        <div style="margin-bottom: 30px;">
          <!-- Diagnosis -->
          ${record.diagnosis ? `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #00bcd4;">
            <h3 style="color: #006064; margin-top: 0; font-size: 18px;">🏥 Diagnóstico</h3>
            <p style="margin-bottom: 0; white-space: pre-wrap;">${record.diagnosis}</p>
          </div>
          ` : ''}

          <!-- Treatment -->
          ${record.treatment ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #4caf50;">
            <h3 style="color: #2e7d32; margin-top: 0; font-size: 18px;">💊 Tratamiento</h3>
            <p style="margin-bottom: 0; white-space: pre-wrap;">${record.treatment}</p>
          </div>
          ` : ''}

          <!-- Notes -->
          ${record.notes ? `
          <div style="background: #fff8e1; padding: 20px; border-radius: 8px; border-left: 5px solid #ff9800;">
            <h3 style="color: #ef6c00; margin-top: 0; font-size: 18px;">📝 Notas Adicionales</h3>
            <p style="margin-bottom: 0; white-space: pre-wrap;">${record.notes}</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #e9ecef; padding-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
          <p>Este documento fue generado automáticamente por SmartVitals</p>
          <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
          <p style="margin-bottom: 0;">© ${new Date().getFullYear()} SmartVitals - Sistema de Monitoreo Médico</p>
        </div>
      </div>
    `;
    }

    private generateRiskBadges(risks: any): string {
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
        <span style="background: ${item.color}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; display: inline-block;">
          ${item.label}
        </span>
      `);

        if (activeBadges.length === 0) {
            return `
        <span style="background: #28a745; color: white; padding: 8px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; display: inline-block;">
          ✅ Sin riesgos detectados
        </span>
      `;
        }

        return activeBadges.join('');
    }
}
