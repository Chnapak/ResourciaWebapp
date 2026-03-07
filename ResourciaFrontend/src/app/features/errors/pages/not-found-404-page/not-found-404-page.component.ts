import { Component } from '@angular/core';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ChipComponent } from '../../../../shared/ui/chip/chip.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ ButtonComponent, ChipComponent ],
  templateUrl: './not-found-404-page.component.html',
  styleUrl: './not-found-404-page.component.scss'
})
export class NotFoundPageComponent {

}
