import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-[#F5F5DC] flex items-center justify-center px-4">
      <router-outlet />
    </div>
  `,
})
export class AuthLayoutComponent {}