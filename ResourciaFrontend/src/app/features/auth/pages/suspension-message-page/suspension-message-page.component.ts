import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suspension-message-page',
  imports: [ DatePipe ],
  templateUrl: './suspension-message-page.component.html',
  styleUrl: './suspension-message-page.component.scss'
})
export class SuspensionMessagePageComponent implements OnInit  {
  reason!: string;
  type!: string;
  restoreDate!: string;
  caseId!: string;

  constructor(private router: Router) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    console.log(history.state);

    if (history.state) {
      this.reason = history.state.reason;
      this.type = history.state.type;
      this.restoreDate = history.state.restoreDate;
      this.caseId = history.state.caseId;
    }
  }

}
