import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
  <div class="h-dvh bg-[#F5F5DC] grid place-items-center p-4 overflow-hidden">
    <router-outlet />
  </div>
`,
})
export class AuthLayoutComponent {}