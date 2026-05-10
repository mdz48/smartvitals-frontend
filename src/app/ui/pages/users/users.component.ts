import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserService } from '../../../features/user/user.service';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../features/user/models/user';
import { Router } from '@angular/router';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';

import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    TableModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    FileUploadModule,
    DropdownModule,
    CheckboxModule,
    InputNumberModule,
    PasswordModule,
    TagModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  providers: [MessageService, ConfirmationService]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  currentUser!: User;
  loading: boolean = false;

  // Dialog controls
  userDialog: boolean = false;
  deleteUserDialog: boolean = false;
  selectedUser: Partial<User> = {};
  editingUser: Partial<User> = {};
  profilePicture: File | null = null;

  // Filter
  globalFilter: string = '';

  // Options
  genderOptions = [
    { label: 'Masculino', value: 'male' },
    { label: 'Femenino', value: 'female' },
    { label: 'Otro', value: 'other' }
  ];

  roleOptions = [
    { label: 'Paciente', value: 'patient' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Administrador', value: 'admin' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    // Verificar que el usuario actual es admin
    this.currentUser = this.authService.getUser() as User;
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.router.navigate(['/home']);
      return;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los usuarios',
          life: 3000
        });
        this.loading = false;
      }
    });
  }

  openNew(): void {
    this.editingUser = {};
    this.profilePicture = null;
    this.userDialog = true;
  }

  editUser(user: User): void {
    this.editingUser = { ...user };
    this.profilePicture = null;
    this.userDialog = true;
  }

  deleteUser(user: User): void {
    this.selectedUser = user;
    this.deleteUserDialog = true;
  }

  confirmDelete(): void {
    if (this.selectedUser.id) {
      // No permitir que el admin se elimine a sí mismo
      if (this.selectedUser.id === this.currentUser.id) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No puedes eliminar tu propia cuenta',
          life: 3000
        });
        this.deleteUserDialog = false;
        return;
      }

      this.userService.deleteUser(this.selectedUser.id).subscribe({
        next: () => {
          this.users = this.users.filter(user => user.id !== this.selectedUser.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario eliminado correctamente',
            life: 3000
          });
          this.deleteUserDialog = false;
          this.selectedUser = {};
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar el usuario',
            life: 3000
          });
        }
      });
    }
  }

  saveUser(): void {
    if (!this.editingUser.name || !this.editingUser.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor complete los campos obligatorios',
        life: 3000
      });
      return;
    }

    if (this.editingUser.id) {
      // Actualizar usuario existente
      this.userService.updateUser(this.editingUser as User, this.profilePicture || undefined).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(user => user.id === updatedUser.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario actualizado correctamente',
            life: 3000
          });
          this.userDialog = false;
          this.editingUser = {};
          this.profilePicture = null;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el usuario',
            life: 3000
          });
        }
      });
    } else {
      // Por ahora solo permitimos editar usuarios existentes
      // Podrías agregar un endpoint de registro si es necesario
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'La creación de nuevos usuarios debe hacerse a través del registro',
        life: 3000
      });
    }
  }

  hideDialog(): void {
    this.userDialog = false;
    this.editingUser = {};
    this.profilePicture = null;
  }

  onFileSelect(event: any): void {
    if (event.files && event.files.length > 0) {
      this.profilePicture = event.files[0];
    }
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case 'admin': return 'danger';
      case 'doctor': return 'info';
      case 'patient': return 'success';
      default: return 'secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return role;
    }
  }

  getGenderLabel(gender: string): string {
    switch (gender) {
      case 'male': return 'Masculino';
      case 'female': return 'Femenino';
      case 'other': return 'Otro';
      default: return gender;
    }
  }
}
