import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service'; 
import { RegisterModalComponent } from '../../components/register/register.component';
import { User } from '../../../features/user/models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RegisterModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  error: string = '';
  showRegisterModal = false;

  // 🟡 Nuevas propiedades para las animaciones
  showDoctorAnimation = false;
  showLoginForm = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const shouldAnimate = localStorage.getItem('showDoctorFirst') === 'true';

    if (shouldAnimate) {
      this.showDoctorAnimation = true;
      localStorage.removeItem('showDoctorFirst'); // Se borra para que no se repita en el siguiente login

      // Mostrar el formulario después de la animación del doctor
      setTimeout(() => {
        this.showLoginForm = true;
      }, 1500); // tiempo igual al de la animación CSS
    } else {
      // Si no se requiere animación, mostrar todo de inmediato
      this.showLoginForm = true;
    }
  }

  login(): void {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (user: User) => {
        this.authService.setUser(user);
        this.router.navigate(['/home']);
      },
      error: err => {
        this.error = 'Correo o contraseña incorrectos';
        console.error(err);
      }
    });
  }

  goToRegister(): void {
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }
}
