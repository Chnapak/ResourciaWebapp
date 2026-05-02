/**
 * Admin page for closed-beta invite management.
 */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { BetaInvite } from '../../models/beta-invite.model';
import { AdminService } from '../../../../core/services/admin.service';
import { ToasterService } from '../../../../shared/toaster/toaster.service';

@Component({
  selector: 'app-beta-invites-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminHeaderComponent, DatePipe],
  templateUrl: './beta-invites-page.component.html',
  styleUrl: './beta-invites-page.component.scss'
})
export class BetaInvitesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toaster = inject(ToasterService);

  invites: BetaInvite[] = [];
  registrationMode: string | null = null;
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  inviteError: string | null = null;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.loadInvites();
  }

  createInvite(): void {
    this.inviteError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const email = this.form.getRawValue().email.trim();

    this.adminService.createBetaInvite(email).subscribe({
      next: (invite) => {
        this.invites = [invite, ...this.invites];
        this.form.reset();
        this.isSubmitting = false;
        this.toaster.show('Invite created.', 'success');
      },
      error: (err) => {
        console.error('Failed to create invite', err);
        this.inviteError = this.mapInviteError(err?.error?.error);
        this.isSubmitting = false;
      }
    });
  }

  revokeInvite(invite: BetaInvite): void {
    if (invite.status !== 'Pending') {
      return;
    }

    const confirmed = window.confirm(`Revoke invite for ${invite.email}?`);
    if (!confirmed) {
      return;
    }

    this.adminService.revokeBetaInvite(invite.id).subscribe({
      next: () => {
        const revokedAtUtc = new Date().toISOString();
        this.invites = this.invites.map((currentInvite) =>
          currentInvite.id === invite.id
            ? { ...currentInvite, status: 'Revoked', revokedAtUtc }
            : currentInvite
        );
        this.toaster.show('Invite revoked.', 'success');
      },
      error: (err) => {
        console.error('Failed to revoke invite', err);
        this.toaster.show('Failed to revoke invite.', 'error');
      }
    });
  }

  statusClass(status: BetaInvite['status']): string {
    if (status === 'Pending') {
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    }

    if (status === 'Used') {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    }

    return 'bg-slate-100 text-slate-600 ring-slate-200';
  }

  private loadInvites(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService.getBetaInvites().subscribe({
      next: (response) => {
        this.registrationMode = response.registrationMode;
        this.invites = response.items;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load beta invites', err);
        this.registrationMode = null;
        this.error = 'Failed to load beta invites.';
        this.isLoading = false;
      }
    });
  }

  private mapInviteError(errorCode?: string): string {
    if (errorCode === 'INVITE_ALREADY_EXISTS') {
      return 'That email already has a pending invite.';
    }

    if (errorCode === 'EMAIL_ALREADY_REGISTERED') {
      return 'That email already belongs to an active account.';
    }

    return 'Could not create the invite. Please check the email and try again.';
  }
}
