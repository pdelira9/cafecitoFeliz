import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardSummaryResponse } from '../../core/services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  loading = true;
  errorMsg = '';

  data: DashboardSummaryResponse | null = null;

 //Fechas para filtro (YYYY-MM-DD)
// Por default: hoy
 
  from = '';
  to = '';

  constructor(private dashboardApi: DashboardService) {}

  ngOnInit(): void {
    // Default hoy en formato YYYY-MM-DD
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    this.from = iso;
    this.to = iso;

    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';

    this.dashboardApi.summary(this.from, this.to).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se pudo cargar el dashboard.';
        this.loading = false;
      },
    });
  }
}
