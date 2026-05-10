import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { User } from '../../../features/user/models/user';
import { AuthService } from '../../../auth/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Record } from '../../../features/medicalRecord/models/record';
import { MedicalRecordService } from '../../../features/medicalRecord/medical-record.service';
import { PdfGeneratorService } from '../../../features/medicalRecord/pdf-generator.service';
import { EmailService } from '../../../features/medicalRecord/email.service';
import { UserService } from '../../../features/user/user.service';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextarea } from 'primeng/inputtextarea';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    InputTextModule,
    TableModule,
    ButtonModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    TooltipModule,
    RouterModule,
    DialogModule,
    ToastModule,
    InputTextarea
  ],
  providers: [MessageService],
  templateUrl: './medical-records.component.html',
  styleUrl: './medical-records.component.css'
})
export class MedicalRecordsComponent implements OnInit {
  currentUser!: User;
  patients: User[] = [];
  records: Record[] = [];
  rangeDates: Date[] | undefined;
  selectedPatient: User | undefined;
  recordNumber: string = '';
  patientOptions: any[] = [];
  downloadingRecords: Set<number> = new Set();

  // Estados de carga y error
  isLoading: boolean = false;
  isLoadingPatients: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  // Variables para el diálogo de correo
  showEmailDialog: boolean = false;
  emailDestination: string = '';
  customMessage: string = '';
  selectedRecordId: number | null = null;
  sendingEmail: boolean = false;
  selectedDestinationType: string = 'doctor';
  destinationOptions: any[] = [];
  customEmail: string = '';

  // Variables para el diálogo de edición
  showEditDialog: boolean = false;
  editingRecord: Record | null = null;
  updatingRecord: boolean = false;
  editForm = {
    diagnosis: '',
    treatment: '',
    notes: ''
  };

  constructor(
    private authService: AuthService,
    private recordService: MedicalRecordService,
    private pdfGenerator: PdfGeneratorService,
    private emailService: EmailService,
    private userService: UserService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    if (this.authService.getUser()) {
      this.currentUser = this.authService.getUser() as User;
    }
    this.getRecords();
    if (this.currentUser.role === 'doctor') {
      this.loadPatients();
    }
  }

  loadPatients(): void {
    if (!this.currentUser.id) {
      console.error('Doctor ID is not available');
      return;
    }
    this.isLoadingPatients = true;
    this.userService.getPatients(this.currentUser.id).subscribe({
      next: (data) => {
        this.patients = data;
        this.patientOptions = data.map(patient => ({
          label: `${patient.name} ${patient.lastname}`,
          value: patient
        }));
        this.isLoadingPatients = false;
      },
      error: (error) => {
        console.error('Error fetching patients:', error);
        this.isLoadingPatients = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de pacientes',
          life: 3000
        });
      }
    });
  }

  getRecords(): void {
    if (!this.currentUser.id) {
      console.error('Doctor ID is not available');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    if (this.currentUser.role === 'doctor') {
      this.recordService.getDoctorMedicalRecords(this.currentUser.id).subscribe({
        next: (data) => {
          this.records = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching doctor medical records:', error);
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'Error al cargar los expedientes médicos';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los expedientes médicos',
            life: 3000
          });
        }
      });
    } else if (this.currentUser.role === 'patient') {
      this.recordService.getPatientMedicalRecords(this.currentUser.id).subscribe({
        next: (data) => {
          this.records = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching patient medical records:', error);
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'Error al cargar los expedientes médicos';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los expedientes médicos',
            life: 3000
          });
        }
      });
    }
  }

  getPatients(): User[] {
    return this.patients;
  }

  applyFilters(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Si hay al menos una fecha seleccionada
    if (this.rangeDates && this.rangeDates.length > 0 && this.rangeDates[0]) {
      // Si solo hay una fecha, usa la misma para inicio y fin
      const startDate = this.rangeDates[0].toISOString().split('T')[0];
      const endDate = (this.rangeDates[1] ? this.rangeDates[1] : this.rangeDates[0]).toISOString().split('T')[0];

      if (this.currentUser.role === 'doctor') {
        const doctorId = this.currentUser.id!;
        let patientId = this.selectedPatient?.id!;

        if (patientId) {
          this.recordService.getPatientMedicalRecordsByRange(patientId, startDate, endDate).subscribe({
            next: (data) => {
              this.records = this.filterByRecordNumber(data);
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error filtrando por paciente y rango:', error);
              this.isLoading = false;
              this.hasError = true;
              this.errorMessage = 'Error al filtrar expedientes por fecha';
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al filtrar expedientes por fecha',
                life: 3000
              });
            }
          });
        } else {
          this.recordService.getDoctorMedicalRecordsByRange(doctorId, startDate, endDate).subscribe({
            next: (data) => {
              this.records = this.filterByRecordNumber(data);
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error filtrando por doctor y rango:', error);
              this.isLoading = false;
              this.hasError = true;
              this.errorMessage = 'Error al filtrar expedientes por fecha';
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al filtrar expedientes por fecha',
                life: 3000
              });
            }
          });
        }
      } else if (this.currentUser.role === 'patient') {
        const patientId = this.currentUser.id!;
        this.recordService.getPatientMedicalRecordsByRange(patientId, startDate, endDate).subscribe({
          next: (data) => {
            this.records = this.filterByRecordNumber(data);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error filtrando por paciente y rango:', error);
            this.isLoading = false;
            this.hasError = true;
            this.errorMessage = 'Error al filtrar expedientes por fecha';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al filtrar expedientes por fecha',
              life: 3000
            });
          }
        });
      }
    } else if (this.recordNumber) {
      this.records = this.filterByRecordNumber(this.records);
      this.isLoading = false;
    } else {
      this.getRecords();
    }
  }

  // Método auxiliar para filtrar por número de expediente
  filterByRecordNumber(records: Record[]): Record[] {
    if (!this.recordNumber) return records;
    return records.filter(record => record.id.toString().includes(this.recordNumber));
  }

  async downloadRecordPDF(recordId: number): Promise<void> {
    this.downloadingRecords.add(recordId);

    try {
      // Obtener el record completo con riesgos
      this.recordService.getMedicalRecordWithRisks(recordId).subscribe({
        next: async (recordWithRisks) => {
          try {
            await this.pdfGenerator.generateRecordPDF(recordWithRisks);
          } catch (error) {
            console.error('Error generating PDF:', error);
          } finally {
            this.downloadingRecords.delete(recordId);
          }
        },
        error: (error) => {
          console.error('Error fetching record:', error);
          this.downloadingRecords.delete(recordId);
        }
      });
    } catch (error) {
      console.error('Error in downloadRecordPDF:', error);
      this.downloadingRecords.delete(recordId);
    }
  }

  isDownloading(recordId: number): boolean {
    return this.downloadingRecords.has(recordId);
  }

  openEmailDialog(recordId: number): void {
    this.selectedRecordId = recordId;
    this.emailDestination = '';
    this.customMessage = '';
    this.selectedDestinationType = 'doctor';
    this.customEmail = '';

    // Configurar opciones de destinatarios
    this.destinationOptions = [];
    const record = this.records.find(r => r.id === recordId);

    if (record) {
      if (this.currentUser.role === 'doctor') {
        // Opciones para doctor
        this.destinationOptions = [
          { label: `Paciente: ${record.patient.name} ${record.patient.lastname}`, value: 'patient' },
          { label: `Mi correo: ${this.currentUser.email}`, value: 'self' },
          { label: 'Otro correo personalizado', value: 'other' }
        ];
        this.selectedDestinationType = 'patient';
      } else if (this.currentUser.role === 'patient') {
        // Opciones para paciente
        this.destinationOptions = [
          { label: `Mi correo: ${this.currentUser.email}`, value: 'self' }
        ];

        if (record.doctor) {
          this.destinationOptions.unshift(
            { label: `Dr. ${record.doctor.name} ${record.doctor.lastname}`, value: 'doctor' }
          );
          this.selectedDestinationType = 'doctor';
        } else {
          this.selectedDestinationType = 'self';
        }

        this.destinationOptions.push({ label: 'Otro correo personalizado', value: 'other' });
      }
    }

    this.updateEmailDestination();
    this.showEmailDialog = true;
  }

  getSelectedRecord(): any {
    if (!this.selectedRecordId) return null;
    return this.records.find(r => r.id === this.selectedRecordId);
  }

  updateEmailDestination(): void {
    const record = this.records.find(r => r.id === this.selectedRecordId);
    if (!record) return;

    switch (this.selectedDestinationType) {
      case 'doctor':
        if (record.doctor) {
          this.emailDestination = record.doctor.email;
          this.customMessage = `Estimado/a Dr. ${record.doctor.name} ${record.doctor.lastname}, le envío mi expediente médico #${record.id} para su revisión.`;
        }
        break;
      case 'patient':
        this.emailDestination = record.patient.email;
        this.customMessage = `Estimado/a ${record.patient.name} ${record.patient.lastname}, adjunto encontrará su expediente médico completo del ${new Date(record.created_at).toLocaleDateString('es-ES')}.`;
        break;
      case 'self':
        this.emailDestination = this.currentUser.email;
        this.customMessage = `Copia de su expediente médico #${record.id} del ${new Date(record.created_at).toLocaleDateString('es-ES')}.`;
        break;
      case 'other':
        this.emailDestination = this.customEmail;
        this.customMessage = `Expediente médico #${record.id} del ${new Date(record.created_at).toLocaleDateString('es-ES')}.`;
        break;
      default:
        this.emailDestination = '';
        this.customMessage = '';
    }
  }

  onDestinationTypeChange(): void {
    if (this.selectedDestinationType === 'other') {
      this.emailDestination = this.customEmail;
    } else {
      this.updateEmailDestination();
    }
  }

  onCustomEmailChange(): void {
    if (this.selectedDestinationType === 'other') {
      this.emailDestination = this.customEmail;
    }
  }

  closeEmailDialog(): void {
    this.showEmailDialog = false;
    this.selectedRecordId = null;
    this.emailDestination = '';
    this.customMessage = '';
    this.selectedDestinationType = 'doctor';
    this.customEmail = '';
    this.destinationOptions = [];
  }

  sendRecordByEmail(): void {
    if (!this.selectedRecordId || !this.emailDestination) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, ingresa una dirección de correo válida'
      });
      return;
    }

    // Validar formato de correo
    if (!this.isValidEmail(this.emailDestination)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, ingresa una dirección de correo válida'
      });
      return;
    }

    this.sendingEmail = true;

    // Obtener el expediente completo con riesgos
    this.recordService.getMedicalRecordWithRisks(this.selectedRecordId).subscribe({
      next: (recordWithRisks) => {
        // Enviar por correo
        this.emailService.sendMedicalRecordByEmail(
          recordWithRisks,
          this.emailDestination,
          this.customMessage
        ).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `El expediente médico ha sido enviado correctamente a ${this.emailDestination}`
            });
            this.closeEmailDialog();
          },
          error: (error) => {
            console.error('Error al enviar el correo:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo enviar el expediente por correo. Verifica tus credenciales de EmailJS.'
            });
          },
          complete: () => {
            this.sendingEmail = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener el expediente:', error);
        this.sendingEmail = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo obtener el expediente médico'
        });
      }
    });
  }

  isEmailInvalid(): boolean {
    if (this.selectedDestinationType === 'other') {
      return !this.customEmail || !this.isValidEmail(this.customEmail);
    } else {
      return !this.emailDestination || !this.isValidEmail(this.emailDestination);
    }
  }

  // Métodos para edición de expedientes
  openEditDialog(record: Record): void {
    this.editingRecord = { ...record }; // Crear una copia del record
    this.editForm = {
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      notes: record.notes || ''
    };
    this.showEditDialog = true;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.editingRecord = null;
    this.editForm = {
      diagnosis: '',
      treatment: '',
      notes: ''
    };
  }

  canEditRecord(): boolean {
    return this.currentUser.role === 'doctor' || this.currentUser.role === 'admin';
  }

  updateRecord(): void {
    if (!this.editingRecord) return;

    // Validar que al menos un campo tenga contenido
    if (!this.editForm.diagnosis.trim() && !this.editForm.treatment.trim() && !this.editForm.notes.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe completar al menos un campo (diagnóstico, tratamiento o notas)'
      });
      return;
    }

    this.updatingRecord = true;

    const updateData = {
      patient_id: this.editingRecord.patient_id,
      doctor_id: this.editingRecord.doctor_id,
      temperature: this.editingRecord.temperature,
      blood_pressure: this.editingRecord.blood_pressure,
      oxygen_saturation: this.editingRecord.oxygen_saturation,
      heart_rate: this.editingRecord.heart_rate,
      diagnosis: this.editForm.diagnosis.trim(),
      treatment: this.editForm.treatment.trim(),
      notes: this.editForm.notes.trim()
    };

    this.recordService.updateMedicalRecord(this.editingRecord.id, updateData).subscribe({
      next: (updatedRecord) => {
        // Actualizar el record en la lista local
        const index = this.records.findIndex(r => r.id === updatedRecord.id);
        if (index !== -1) {
          this.records[index] = updatedRecord;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Expediente médico actualizado correctamente'
        });
        this.closeEditDialog();
      },
      error: (error) => {
        console.error('Error al actualizar el expediente:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el expediente médico'
        });
      },
      complete: () => {
        this.updatingRecord = false;
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  clearFilters(): void {
    this.rangeDates = [];
    this.recordNumber = '';
    this.selectedPatient = undefined;
    this.hasError = false;
    this.errorMessage = '';
    this.getRecords();
  }
}