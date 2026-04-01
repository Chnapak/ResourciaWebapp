/**
 * Page that displays account suspension details.
 */
import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suspension-message-page',
  imports: [ DatePipe ],
  templateUrl: './suspension-message-page.component.html',
  styleUrl: './suspension-message-page.component.scss'
})
/**
 * Reads suspension data from navigation state and renders it.
 */
export class SuspensionMessagePageComponent implements OnInit  {
  /** Suspension reason provided by the backend. */
  reason!: string;
  /** Suspension type (temporary, permanent, etc.). */
  type!: string;
  /** ISO timestamp for when the suspension ends. */
  restoreDate!: string;
  /** Reference id for support cases. */
  caseId!: string;

  /** Creates the component with router access to navigation state. */
  constructor(private router: Router) {}

  /** Initializes suspension details from navigation state. */
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
