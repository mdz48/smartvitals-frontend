import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { User } from '../../../features/user/models/user';
import { UserService } from '../../../features/user/user.service';
import { AuthService } from '../../../auth/auth.service';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-create-paciente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    MessageModule,
    MessagesModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './create-paciente.component.html',
  styleUrls: ['./create-paciente.component.css']
})
export class CreatePacienteComponent implements OnInit {
  usuarios: User[] = [];
  currentUser!: User;

  // Control de modo: 'email' para CASO 1, 'register' para CASO 2
  mode: 'email' | 'register' = 'email';

  // Para CASO 1: solo email
  patientEmail: string = '';

  // Para CASO 2: datos completos
  nuevoPaciente: User = {
    name: '',
    lastname: '',
    email: '',
    password: '',
    profile_picture: '',
    role: 'patient',
    age: 0,
    gender: 'male',
    pregnant: false
  };

  // Opciones para selects
  genderOptions = [
    { label: 'Masculino', value: 'male' },
    { label: 'Femenino', value: 'female' },
    { label: 'Otro', value: 'other' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    // Obtener el usuario actual (doctor)
    this.currentUser = this.authService.getUser();
    this.obtenerPacientesDesdeAPI();
  }

  obtenerPacientesDesdeAPI() {
    if (this.currentUser?.id) {
      this.userService.getPatients(this.currentUser.id).subscribe({
        next: (data: User[]) => {
          this.usuarios = data;
        },
        error: (err: any) => {
          console.error('Error al obtener pacientes', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los pacientes'
          });
        }
      });
    }
  }

  // Cambiar entre los dos modos
  switchMode(newMode: 'email' | 'register') {
    this.mode = newMode;
    this.resetForm();
  }

  // CASO 1: Agregar paciente existente por email
  agregarPacientePorEmail() {
    if (!this.patientEmail.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor ingrese un email válido'
      });
      return;
    }

    if (!this.currentUser?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al doctor'
      });
      return;
    }

    this.userService.addPatientToDoctorWithEmail(this.currentUser.id, this.patientEmail).subscribe({
      next: (response: User) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Paciente ${response.name} ${response.lastname} agregado correctamente`
        });
        this.resetForm();
        this.obtenerPacientesDesdeAPI();
      },
      error: (err: any) => {
        console.error('Error al agregar paciente por email', err);
        let errorMessage = 'Error al agregar el paciente';

        if (err.status === 404) {
          errorMessage = 'No se encontró un paciente con ese email en el sistema';
        } else if (err.status === 400) {
          errorMessage = 'El paciente ya está asignado a este doctor';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
      }
    });
  }

  // CASO 2: Registrar nuevo paciente
  registrarNuevoPaciente() {
    if (!this.validarDatosNuevoPaciente()) {
      return;
    }

    if (!this.currentUser?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al doctor'
      });
      return;
    }

    this.userService.registerPatientAsDoctor(this.currentUser.id, this.nuevoPaciente).subscribe({
      next: (response: User) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Paciente ${response.name} ${response.lastname} registrado y agregado correctamente`
        });
        this.resetForm();
        this.obtenerPacientesDesdeAPI();
      },
      error: (err: any) => {
        console.error('Error al registrar nuevo paciente', err);
        let errorMessage = 'Error al registrar el paciente';

        if (err.status === 400 && err.error?.detail?.includes('correo')) {
          errorMessage = 'El correo electrónico ya está registrado en el sistema';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
      }
    });
  }

  validarDatosNuevoPaciente(): boolean {
    if (!this.nuevoPaciente.name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El nombre es requerido'
      });
      return false;
    }
    if (!this.nuevoPaciente.lastname.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El apellido es requerido'
      });
      return false;
    }
    if (!this.nuevoPaciente.email.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El email es requerido'
      });
      return false;
    }
    if (!this.nuevoPaciente.password.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'La contraseña es requerida'
      });
      return false;
    }
    if (!this.nuevoPaciente.age || this.nuevoPaciente.age <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'La edad debe ser un número válido mayor a 0'
      });
      return false;
    }

    // Validación: solo mujeres pueden estar embarazadas
    if (this.nuevoPaciente.pregnant && this.nuevoPaciente.gender !== 'female') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Solo las mujeres pueden estar embarazadas'
      });
      return false;
    }

    return true;
  }

  resetForm() {
    this.patientEmail = '';
    this.nuevoPaciente = {
      name: '',
      lastname: '',
      email: '',
      password: '',
      profile_picture: '',
      role: 'patient',
      age: 0,
      gender: 'male',
      pregnant: false
    };
  }
}
