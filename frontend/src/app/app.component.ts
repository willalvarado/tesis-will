// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <h1 style="text-align:center; margin-top:20px;"></h1>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
}