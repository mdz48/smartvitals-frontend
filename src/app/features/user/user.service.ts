import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { User } from './models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient, private authService: AuthService) { }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${environment.API_URL}/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  getPatients(id: number): Observable<User[]> {
    return this.http.get<User[]>(`${environment.API_URL}/doctors/${id}/patients`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  addPatientToDoctorWithEmail(doctor_id: number, patient_email: string): Observable<User> {
    return this.http.post<User>(`${environment.API_URL}/doctors/${doctor_id}/patients/${patient_email}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Endpoint para registrar un nuevo paciente al sistema como doctor y que se agregue a la lista de pacientes del doctor
  registerPatientAsDoctor(doctor_id: number, patientData: User): Observable<User> {
    return this.http.post<User>(`${environment.API_URL}/doctors/${doctor_id}/register/patient`, patientData, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  removePatientFromDoctor(doctor_id: number, patient_id: number): Observable<void> {
    return this.http.delete<void>(`${environment.API_URL}/doctors/${doctor_id}/patients/${patient_id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  getDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.API_URL}/doctors`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  // Método para obtener todos los usuarios del sistema (solo para admin)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  updateUser(user: User, profilePicture?: File): Observable<User> {
    const formData = new FormData();

    if (user.name) formData.append('name', user.name);
    if (user.lastname) formData.append('lastname', user.lastname);
    if (user.email) formData.append('email', user.email);
    if (user.password) formData.append('password', user.password);
    if (user.gender) formData.append('gender', user.gender);
    if (user.age !== undefined && user.age !== null) formData.append('age', user.age.toString());
    if (user.pregnant !== undefined && user.pregnant !== null) formData.append('pregnant', user.pregnant.toString());
    if (profilePicture) formData.append('profile_picture', profilePicture);

    return this.http.put<User>(`${environment.API_URL}/users/${user.id}`, formData, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  updateUserWithFormData(userId: number, formData: FormData): Observable<User> {
    return this.http.put<User>(`${environment.API_URL}/users/${userId}`, formData, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.API_URL}/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    });
  }
}
