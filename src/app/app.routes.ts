import { Routes } from '@angular/router';
import { LoginComponent } from './ui/pages/login/login.component';
import { HomeComponent } from './ui/pages/home/home.component';
import { PanelComponent } from './ui/pages/panel/panel.component';
import { MedicalRecordsComponent } from './ui/pages/medical-records/medical-records.component';
import { PatientHistoryComponent } from './ui/pages/patient-history/patient-history.component';
import { ProfileComponent } from './ui/pages/profile/profile.component';
import { CreatePacienteComponent } from './ui/pages/create-paciente/create-paciente.component';
import { RecordComponent } from './ui/pages/record/record.component';
import { StadisticsComponent } from './ui/pages/stadistics/stadistics.component';
import { UsersComponent } from './ui/pages/users/users.component';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './guards/admin.guard';


export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'panel', component: PanelComponent, canActivate: [authGuard] },
  { path: 'records', component: MedicalRecordsComponent, canActivate: [authGuard] },
  { path: 'history', component: PatientHistoryComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'createPaciente', component: CreatePacienteComponent, canActivate: [authGuard] },
  { path: 'record/:id', component: RecordComponent, canActivate: [authGuard] },
  { path: 'stadistics', component: StadisticsComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard, adminGuard] },
];
