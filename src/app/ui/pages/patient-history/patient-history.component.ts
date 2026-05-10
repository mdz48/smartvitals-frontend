import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserService } from '../../../features/user/user.service';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../features/user/models/user';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './patient-history.component.html',
  styleUrls: ['./patient-history.component.css']
})
export class PatientHistoryComponent implements OnInit {
  currentUser!: User;
  patients: User[] = [];
  loading: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadPatients();
  }

  loadPatients(): void {
    if (!this.currentUser?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al doctor'
      });
      return;
    }

    this.loading = true;
    this.userService.getPatients(this.currentUser.id).subscribe({
      next: (data: User[]) => {
        this.patients = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al obtener pacientes:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los pacientes'
        });
        this.loading = false;
      }
    });
  }

  removePatient(patient: User): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar al paciente ${patient.name} ${patient.lastname} de su lista?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.currentUser?.id || !patient.id) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al procesar la eliminación'
          });
          return;
        }

        this.userService.removePatientFromDoctor(this.currentUser.id, patient.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Paciente ${patient.name} ${patient.lastname} eliminado correctamente`
            });
            this.loadPatients(); // Recargar la lista
          },
          error: (error: any) => {
            console.error('Error al eliminar paciente:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el paciente'
            });
          }
        });
      }
    });
  }

  getGenderLabel(gender: string): string {
    switch (gender) {
      case 'male': return 'Masculino';
      case 'female': return 'Femenino';
      case 'other': return 'Otro';
      default: return gender;
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No registrada';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('es-ES');
  }
}
