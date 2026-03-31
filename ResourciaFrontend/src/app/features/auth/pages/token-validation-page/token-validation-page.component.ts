import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ResourceService } from '../../../../core/services/resource.service';
import { CreateResourceRequestModel } from '../../../../shared/models/create-resource-request';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { Filter as SearchSchemaFilter } from '../../../../shared/models/search-schema';


@Component({
  selector: 'app-token-validation-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './token-validation-page.component.html',
  styleUrl: './token-validation-page.component.scss'
})
export class TokenValidationPageComponent implements OnInit {
  private readonly featuredFilterKeys = [
    'subject',
    'type',
    'resourcetype',
    'resource-type',
    'format',
  ];

  protected readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  protected readonly resourceService = inject(ResourceService);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  verifying = false;
  submittingResource = false;
  filtersLoading = true;
  error: string | null = null;
  step = 1;
  createdResourceId: string | null = null;

  protected email?: string | null;
  protected token?: string | null;
  protected primaryFilter: SearchSchemaFilter | null = null;

  readonly resourceForm = this.fb.nonNullable.group({
    resourceTitle: ['', [Validators.required]],
    resourceUrl: ['', [Validators.required, this.resourceUrlValidator()]],
    resourcePrimaryFilter: [''],
  });

  get titleControl(): AbstractControl | null {
    return this.resourceForm.get('resourceTitle');
  }

  get urlControl(): AbstractControl | null {
    return this.resourceForm.get('resourceUrl');
  }

  get hasPrimaryFilterOptions(): boolean {
    return (this.primaryFilter?.values?.length ?? 0) > 0;
  }

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    this.token = typeof queryParams['token'] === 'string'
      ? decodeURIComponent(queryParams['token'])
      : null;
    this.email = typeof queryParams['email'] === 'string'
      ? queryParams['email']
      : null;

    if (!this.token || !this.email) {
      this.error = 'This confirmation link is incomplete. Request a new email and try again.';
    }

    this.loadPrimaryFilter();
  }

  confirmEmail(): void {
    if (!this.token || !this.email || this.verifying) {
      return;
    }

    this.verifying = true;
    this.error = null;

    this.authService.confirmToken(this.token, this.email).subscribe({
      next: () => {
        this.verifying = false;
        this.step = 2;
      },
      error: () => {
        this.verifying = false;
        this.error = "Token is old or invalid. Get a new link or start over.";
      }
    });
  }

  addResource(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    this.submittingResource = true;
    this.error = null;

    this.resourceService.createResource(this.buildPayload()).subscribe({
      next: (response) => {
        this.submittingResource = false;
        this.createdResourceId = response.id;
        this.step = 3;
      },
      error: (err) => {
        this.submittingResource = false;
        this.error = err?.error?.error ?? 'Something went wrong while creating the resource.';
      }
    });
  }

  skipResource(): void {
    if (this.submittingResource) {
      return;
    }

    this.error = null;
    this.step = 3;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  viewCreatedResource(): void {
    if (!this.createdResourceId) {
      this.router.navigate(['/search']);
      return;
    }

    this.router.navigate(['/resource', this.createdResourceId]);
  }

  private loadPrimaryFilter(): void {
    this.filtersLoading = true;

    this.resourceService.getResourceSchema().subscribe({
      next: (schema) => {
        const availableFilters = (schema.filters ?? []).filter((filter) =>
          filter.kind === FilterKind.Facet && (filter.values?.length ?? 0) > 0);

        this.primaryFilter = this.featuredFilterKeys
          .map((key) => availableFilters.find((filter) => filter.key.toLowerCase() === key))
          .find((filter): filter is SearchSchemaFilter => filter !== undefined)
          ?? availableFilters[0]
          ?? null;

        this.filtersLoading = false;
      },
      error: () => {
        this.primaryFilter = null;
        this.filtersLoading = false;
      },
    });
  }

  private buildPayload(): CreateResourceRequestModel {
    const payload: CreateResourceRequestModel = {
      title: this.resourceForm.controls.resourceTitle.value.trim(),
      url: this.normalizeUrl(this.resourceForm.controls.resourceUrl.value),
    };

    const selectedPrimaryFilter = this.toNullableString(this.resourceForm.controls.resourcePrimaryFilter.value);
    if (this.primaryFilter && selectedPrimaryFilter) {
      payload.filterValues = {
        [this.primaryFilter.key]: [selectedPrimaryFilter]
      };
    }

    return payload;
  }

  private resourceUrlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = this.toNullableString(control.value);
      if (!value) {
        return null;
      }

      try {
        new URL(this.normalizeUrl(value));
        return null;
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  private normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  private toNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }
}
