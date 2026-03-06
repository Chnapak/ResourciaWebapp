import { Component } from '@angular/core';
import { Dropdown } from 'flowbite';
import { DropdownComponent, DropdownItem } from '../../../../../../shared/ui/dropdown/dropdown.component';

@Component({
  selector: 'app-language-switcher',
  imports: [DropdownComponent],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  currentLang = 'EN';

  languageItems: DropdownItem[] = [
    {
      type: 'action',
      label: 'English',
      action: () => this.switchLanguage('EN', '/')
    },
    {
      type: 'action',
      label: 'Čeština',
      action: () => this.switchLanguage('CS', '/cs/')
    }
  ];

  switchLanguage(code: 'EN' | 'CS', path: string): void {
    this.currentLang = code;
    window.location.href = path;
  }
}
