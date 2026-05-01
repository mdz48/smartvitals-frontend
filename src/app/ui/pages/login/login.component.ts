import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service'; 
import { RegisterModalComponent } from '../../components/register/register.component';
import { User } from '../../../features/user/models/user';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RegisterModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  error: string = '';
  showRegisterModal = false;

  // 🟡 Nuevas propiedades para las animaciones
  showDoctorAnimation = false;
  showLoginForm = false;

  // 🔵 Propiedades para el aviso de DEMO
  showDemoOverlay = true;
  serverReady = false;
  demoStatusMessage = 'Conectando con el servidor...';
  healthCheckInterval: any = null;
  dotCount = 0;
  dotInterval: any = null;
  attemptCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Si ya se verificó el servidor en esta sesión, no mostrar overlay
    if (sessionStorage.getItem('serverReady') === 'true') {
      this.showDemoOverlay = false;
      this.serverReady = true;
      this.initAnimations();
      return;
    }

    // Iniciar polling del health check
    this.startHealthCheck();
    this.startDotAnimation();
  }

  ngOnDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.dotInterval) {
      clearInterval(this.dotInterval);
    }
  }

  private startDotAnimation(): void {
    this.dotInterval = setInterval(() => {
      this.dotCount = (this.dotCount + 1) % 4;
    }, 500);
  }

  get animatedDots(): string {
    return '.'.repeat(this.dotCount);
  }

  private startHealthCheck(): void {
    // Intentar inmediatamente la primera vez
    this.checkHealth();

    // Luego cada 5 segundos
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, 5000);
  }

  private checkHealth(): void {
    this.attemptCount++;

    // Construir la URL base (quitar /api del final)
    const baseUrl = environment.API_URL.replace(/\/api$/, '');

    this.http.get<{ status: string }>(`${baseUrl}/health`).subscribe({
      next: (response) => {
        if (response.status === 'ok') {
          this.onServerReady();
        }
      },
      error: () => {
        // El servidor aún no responde, actualizar mensaje
        if (this.attemptCount <= 3) {
          this.demoStatusMessage = 'Iniciando el servidor';
        } else if (this.attemptCount <= 8) {
          this.demoStatusMessage = 'El servidor está despertando';
        } else {
          this.demoStatusMessage = 'Casi listo, gracias por tu paciencia';
        }
      }
    });
  }

  private onServerReady(): void {
    // Limpiar intervalos
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.dotInterval) {
      clearInterval(this.dotInterval);
      this.dotInterval = null;
    }

    this.serverReady = true;
    this.demoStatusMessage = '¡Servidor listo!';

    // Guardar en sessionStorage para no volver a mostrar en esta sesión
    sessionStorage.setItem('serverReady', 'true');

    // Cerrar overlay con animación después de un breve delay
    setTimeout(() => {
      this.showDemoOverlay = false;
      this.initAnimations();
    }, 1500);
  }

  private initAnimations(): void {
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

  quickLogin(role: 'patient' | 'doctor'): void {
    if (role === 'patient') {
      this.email = 'patient@demo.com';
      this.password = '123456';
    } else {
      this.email = 'doctor@demo.com';
      this.password = '123456';
    }
    this.login();
  }

  goToRegister(): void {
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }
}
