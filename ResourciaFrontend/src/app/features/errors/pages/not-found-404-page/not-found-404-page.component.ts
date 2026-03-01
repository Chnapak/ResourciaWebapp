import { Component } from '@angular/core';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ ButtonComponent ],
  templateUrl: './not-found-404-page.component.html',
  styleUrl: './not-found-404-page.component.scss'
})
export class NotFoundPageComponent {

}
