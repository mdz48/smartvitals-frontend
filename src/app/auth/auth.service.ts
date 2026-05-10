import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../features/user/models/user';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.API_URL;
  private user !: User
  private isLoggedIn = false;
  private options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    }
  };

  // BehaviorSubject para manejar los datos del usuario
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient, private router: Router) { }

  register(data: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, data);
  }

  login(data: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/login`, data);
  }

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.setLoggedIn(true);
    this.setToken(user.access_token ?? '');
    this.user = user;
    // Emitir el usuario actual
    this.currentUserSubject.next(user);
  }

  getUser(): User {
    if (this.user) {
      return this.user;
    }
    const user = localStorage.getItem('user');
    if (user) {
      this.user = JSON.parse(user);
      // Emitir el usuario actual si no se ha hecho antes
      if (!this.currentUserSubject.value) {
        this.currentUserSubject.next(this.user);
      }
      return this.user;
    }

    return {} as User; // Return an empty User object if no user is found
  }

  // Método para actualizar los datos del usuario
  updateUserData(updatedUser: User): void {
    this.user = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  // Método para obtener el usuario actual sin hacer llamada al servicio
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLogged(): boolean {
  const token = localStorage.getItem('token');
  return !!token;
} 


  setLoggedIn(status: boolean): void {
    this.isLoggedIn = status;
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.setLoggedIn(false);
    this.currentUserSubject.next(null);

    localStorage.setItem('showDoctorFirst', 'true'); 
    this.router.navigate(['/login']);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.options.headers['Authorization'] = `Bearer ${token}`;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
