import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../features/user/models/user';

// PrimeNG imports
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterModalComponent {
  @Output() close = new EventEmitter<void>();

  registerForm!: FormGroup;
  visible: boolean = true;
  isLoading: boolean = false;

  roleOptions = [
    { label: 'Paciente', value: 'patient' },
    { label: 'Doctor', value: 'doctor' },
  ];

  genderOptions = [
    { label: 'Masculino', value: 'male' },
    { label: 'Femenino', value: 'female' },
    // { label: 'Otro', value: 'other' }
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['patient', Validators.required],
      gender: ['other'],
      age: [0, [Validators.min(1), Validators.max(120)]],
      pregnant: [false]
    });

    // Escuchar cambios en el género para controlar el campo de embarazo
    this.registerForm.get('gender')?.valueChanges.subscribe(gender => {
      const pregnantControl = this.registerForm.get('pregnant');
      if (gender !== 'female') {
        pregnantControl?.setValue(false);
        pregnantControl?.disable();
      } else {
        pregnantControl?.enable();
      }
    });
  }

  register() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const formData = this.registerForm.value;

      const registerData: User = {
        name: formData.name,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile_picture: 'https://smartvitals-bucket.s3.us-east-1.amazonaws.com/default_profile_picture.png',
        gender: formData.gender,
        pregnant: formData.pregnant || false,
        age: formData.age
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.isLoading = false;
          this.authService.login({
            email: formData.email,
            password: formData.password
          }).subscribe((data : User) => {
            this.authService.setUser(data);
            this.router.navigate(['/home']);
          });
          this.messageService.add({
            severity: 'success',
            summary: 'Registro exitoso',
            detail: 'Usuario registrado correctamente'
          });
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);

          // Extraer mensaje de error del backend
          let errorMessage = 'Error al registrar usuario';
          if (err.error && err.error.detail) {
            errorMessage = err.error.detail;
          } else if (err.message) {
            errorMessage = err.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error en el registro',
            detail: errorMessage
          });
        },
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todos los campos requeridos'
      });
      this.markFormGroupTouched();
    }
  }

  closeModal() {
    this.visible = false;
    setTimeout(() => {
      this.close.emit();
    }, 300);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          name: 'Nombre',
          lastname: 'Apellido',
          email: 'Correo electrónico',
          password: 'Contraseña',
          role: 'Rol',
          age: 'Edad'
        };
        return `${fieldLabels[fieldName] || fieldName} es requerido`;
      }
      if (field.errors['email']) return 'Correo electrónico inválido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
      if (field.errors['max']) return `El valor máximo es ${field.errors['max'].max}`;
    }
    return '';
  }

  // Método auxiliar para verificar si el campo de embarazo debe estar visible
  get isPregnancyFieldVisible(): boolean {
    return this.registerForm.get('gender')?.value === 'female';
  }
}
