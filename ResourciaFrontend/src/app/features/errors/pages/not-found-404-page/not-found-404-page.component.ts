import { Component } from '@angular/core';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ChipComponent } from '../../../../shared/ui/chip/chip.component';
import { RadioComponent } from '../../../../shared/ui/radio/radio.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ ButtonComponent ],
  templateUrl: './not-found-404-page.component.html',
  styleUrl: './not-found-404-page.component.scss'
})
export class NotFoundPageComponent {

}
