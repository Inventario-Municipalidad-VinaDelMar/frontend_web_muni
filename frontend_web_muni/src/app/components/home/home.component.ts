import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,ButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  daysOfWeek: { day: string, date: string, isToday: boolean, active: boolean }[] = [];
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.calculateWeekDates();
    
  }

  calculateWeekDates(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    
    monday.setDate(today.getDate() - (dayOfWeek - 1));

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    this.daysOfWeek = days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        day,
        date: date.toLocaleDateString('es-ES'),
        isToday: dayOfWeek - 1 === index, 
        active: dayOfWeek - 1 === index 
      };
    });
  }

  setActive(event: Event): void {
    const items = document.querySelectorAll('.semana > div');
    items.forEach(item => {
      (item as HTMLElement).classList.remove('active');
    });

    const target = event.currentTarget as HTMLElement;
    target.classList.add('active');    
  }

  redirectToPlanificacion(): void {
    this.router.navigate(['/planificacion']);
  }

}
