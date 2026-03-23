import { Component } from '@angular/core';
import { Dropdown } from 'flowbite';
import { DropdownComponent, DropdownItem } from '../../../../../../shared/ui/dropdown/dropdown.component';

@Component({
  selector: 'app-explore-menu',
  imports: [ DropdownComponent ],
  templateUrl: './explore-menu.component.html',
  styleUrl: './explore-menu.component.scss'
})
export class ExploreMenuComponent {
  exploreMenuItems: DropdownItem[] = [
    {
      type: 'action',
      label: $localize`The Problem`,
      link: '#problem'
    },
    {
      type: 'action',
      label: $localize`What We Do`,
      link: '#solution'
    },
    {
      type: 'action',
      label: $localize`Who It's For`,
      link: '#audience'
    },
    {
      type: 'action',
      label: $localize`Our Vision`,
      link: '#vision'
    }
  ];
}
