import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { timeout } from 'rxjs';
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
  overlayTimeout: any = null;
  dotCount = 0;
  dotInterval: any = null;
  attemptCount = 0;
  healthBlockedByClient = false;

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
    this.startOverlayTimeout();
  }

  ngOnDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.dotInterval) {
      clearInterval(this.dotInterval);
    }
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
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

  private startOverlayTimeout(): void {
    this.overlayTimeout = setTimeout(() => {
      if (this.serverReady) {
        return;
      }

      this.demoStatusMessage = 'No se pudo validar el estado. Puedes continuar.';
      this.onServerReady(false);
    }, 12000);
  }

  private checkHealth(): void {
    if (this.serverReady || this.healthBlockedByClient) {
      return;
    }

    this.attemptCount++;

    this.http.get(environment.API_URL, { observe: 'response' })
      .pipe(timeout(4000))
      .subscribe({
      next: () => {
        this.onServerReady(true);
      },
      error: (error: HttpErrorResponse) => {
        // Si hay cualquier código HTTP, el backend ya respondió (aunque sea 401/404).
        if (error.status > 0) {
          this.onServerReady(true);
          return;
        }

        if (this.isBlockedByClient(error)) {
          this.healthBlockedByClient = true;
          this.demoStatusMessage = 'uBlock bloqueó la verificación. Continuando...';
          this.wakeServerWithoutHealth();
          this.onServerReady(false);
          return;
        }

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

  private isBlockedByClient(error: HttpErrorResponse): boolean {
    const message = `${error.message ?? ''} ${String(error.error ?? '')}`.toLowerCase();
    return message.includes('err_blocked_by_client') || message.includes('blocked by client');
  }

  private wakeServerWithoutHealth(): void {
    fetch(environment.API_URL, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      keepalive: true
    }).catch(() => {
      // Ignorar: el objetivo es evitar bloqueo de UI cuando /health es filtrado.
    });
  }

  private onServerReady(verifiedByHealth: boolean): void {
    if (this.serverReady) {
      return;
    }

    // Limpiar intervalos
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.dotInterval) {
      clearInterval(this.dotInterval);
      this.dotInterval = null;
    }
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
      this.overlayTimeout = null;
    }

    this.serverReady = true;
    this.demoStatusMessage = verifiedByHealth ? '¡Servidor listo!' : 'Listo, continúa con tu acceso';

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
