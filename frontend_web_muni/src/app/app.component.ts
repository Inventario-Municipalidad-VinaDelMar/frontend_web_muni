import { Component } from '@angular/core';
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent,CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frontend_web_muni';
  isSidebarCollapsed = false; // Estado del sidebar

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed; // Cambiar el estado del sidebar
  }
}
