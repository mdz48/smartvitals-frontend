import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { UserService } from '../../../features/user/user.service';
import { User } from '../../../features/user/models/user';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  sidebarVisible = false;
  user!: User
  search: string = '';
  private subscription: Subscription = new Subscription();

  constructor(
    readonly authService: AuthService,
    readonly userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    // Suscribirse a los cambios del usuario actual
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.user = user;
          console.log('Datos del usuario actualizados en navbar:', user);
        }
      })
    );

    // Cargar datos iniciales si no están disponibles
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
    } else {
      // Solo hacer llamada al servicio si no hay datos en el AuthService
      const userData = this.authService.getUser();
      if (userData && userData.id) {
        this.userService.getUser(userData.id).subscribe({
          next: (data: User) => {
            this.user = data;
            // Actualizar el AuthService con los datos completos
            this.authService.updateUserData(data);
          },
          error: (err) => {
            console.error('Error al obtener los datos del usuario:', err);
          }
        });
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get profileImageUrl(): string {
    return this.user?.profile_picture || '/assets/default-avatar.png';
  }

  get userFullName(): string {
    if (!this.user) return '';
    return `${this.user.name} ${this.user.lastname}`;
  }

  get userRole(): string {
    if (!this.user) return '';
    // Puedes traducir el rol si lo deseas
    switch (this.user.role) {
      case 'admin': return 'Administrador';
      case 'doctor': return 'Doctor';
      case 'patient': return 'Paciente';
      default: return 'Usuario';
    }
  }

  goSearch() {
    // Implementa la lógica de búsqueda si tienes una página de resultados
    // Por ejemplo: this.router.navigate(['/search'], { queryParams: { q: this.search } });
  }

  @Output() searchEvent = new EventEmitter<string>();

  editProfile() {
    this.router.navigate(['/profile']);
    this.menuOpen = false;
    this.sidebarVisible = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.menuOpen = false;
    this.sidebarVisible = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}


