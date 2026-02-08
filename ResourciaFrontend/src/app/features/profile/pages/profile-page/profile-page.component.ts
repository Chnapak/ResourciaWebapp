import { Component, OnInit  } from '@angular/core';

@Component({
  selector: 'app-profile-page',
  imports: [],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  user = { name: 'Chnapak' };

  ngOnInit(): void {
    document.title = `${this.user.name}`;
  }
}
