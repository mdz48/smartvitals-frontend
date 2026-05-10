import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MedicalRecordService } from '../../../features/medicalRecord/medical-record.service';
import { PdfGeneratorService } from '../../../features/medicalRecord/pdf-generator.service';
import { RecordWithRisks } from '../../../features/medicalRecord/models/record-with-risks';

@Component({
  selector: 'app-record',
  standalone: true,
  imports: [CommonModule, NavbarComponent, CardModule, ButtonModule],
  templateUrl: './record.component.html',
  styleUrl: './record.component.css'
})
export class RecordComponent implements OnInit {
  record?: RecordWithRisks;
  loading = true;
  error = '';
  isGeneratingPdf = false;

  constructor(
    private route: ActivatedRoute,
    private recordService: MedicalRecordService,
    private pdfGenerator: PdfGeneratorService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de expediente no válido';
      this.loading = false;
      return;
    }
    this.recordService.getMedicalRecordWithRisks(id).subscribe({
      next: (data) => {
        this.record = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar el expediente';
        this.loading = false;
      }
    });
  }

  async downloadPDF(): Promise<void> {
    if (!this.record) return;

    this.isGeneratingPdf = true;
    try {
      await this.pdfGenerator.generateRecordPDF(this.record);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      this.isGeneratingPdf = false;
    }
  }
}
