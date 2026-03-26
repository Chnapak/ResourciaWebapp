import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
<<<<<<< HEAD
import { ToasterComponent } from './shared/toaster/toaster.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToasterComponent],
=======

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ResourciaFrontend';

  ngOnInit(): void {
    initFlowbite();
  }
}
