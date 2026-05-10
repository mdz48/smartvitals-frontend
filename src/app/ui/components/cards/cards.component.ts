import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cards',
  standalone: true, // si es standalone
  imports: [CommonModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent {
  @Input() borderColor: string = '';
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() subtitle: string = '';
}