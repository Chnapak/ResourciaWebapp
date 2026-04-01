/**
 * Email confirmation page with optional resource creation step.
 */
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
/**
 * Confirms an email token and optionally guides the user to add a resource.
 */
export class TokenValidationPageComponent implements OnInit {
  /** Preferred filter keys used to pick a primary facet for the resource form. */
  private readonly featuredFilterKeys = [
    'subject',
    'type',
    'resourcetype',
    'resource-type',
    'format',
  ];

  /** Form builder for the resource form. */
  protected readonly fb = inject(FormBuilder);
  /** Auth service used to validate the confirmation token. */
  protected readonly authService = inject(AuthService);
  /** Resource service used to submit the optional resource. */
  protected readonly resourceService = inject(ResourceService);
  /** Router used for navigation between steps. */
  protected readonly router = inject(Router);
  /** Route used to read token and email parameters. */
  private readonly route = inject(ActivatedRoute);

  /** Whether the token confirmation is in progress. */
  verifying = false;
  /** Whether the resource submission is in progress. */
  submittingResource = false;
  /** Whether primary filter options are loading. */
  filtersLoading = true;
  /** Optional error message displayed to the user. */
  error: string | null = null;
  /** Current step in the multi-step flow. */
  step = 1;
  /** Newly created resource id, if any. */
  createdResourceId: string | null = null;

  /** Email parsed from the confirmation link. */
  protected email?: string | null;
  /** Token parsed from the confirmation link. */
  protected token?: string | null;
  /** Primary filter used to tag the optional resource. */
  protected primaryFilter: SearchSchemaFilter | null = null;

  /** Reactive form for the optional resource submission. */
  readonly resourceForm = this.fb.nonNullable.group({
    resourceTitle: ['', [Validators.required]],
    resourceUrl: ['', [Validators.required, this.resourceUrlValidator()]],
    resourcePrimaryFilter: [''],
  });

  /** Convenience accessor for the title control. */
  get titleControl(): AbstractControl | null {
    return this.resourceForm.get('resourceTitle');
  }

  /** Convenience accessor for the URL control. */
  get urlControl(): AbstractControl | null {
    return this.resourceForm.get('resourceUrl');
  }

  /** True when the primary filter has selectable values. */
  get hasPrimaryFilterOptions(): boolean {
    return (this.primaryFilter?.values?.length ?? 0) > 0;
  }

  /** Reads query params and loads the primary filter for the resource form. */
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

  /** Confirms the email token via the auth service. */
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

  /** Submits the optional resource form. */
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

  /** Skips resource creation and advances to the final step. */
  skipResource(): void {
    if (this.submittingResource) {
      return;
    }

    this.error = null;
    this.step = 3;
  }

  /** Navigates to the home page. */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /** Navigates to the newly created resource (or search as fallback). */
  viewCreatedResource(): void {
    if (!this.createdResourceId) {
      this.router.navigate(['/search']);
      return;
    }

    this.router.navigate(['/resource', this.createdResourceId]);
  }

  /** Loads the primary filter used in the resource form. */
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

  /** Builds the payload for resource creation based on the form. */
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

  /** Validates resource URLs with a permissive protocol check. */
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

  /** Normalizes URLs to ensure a protocol is present. */
  private normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  /** Coerces a value into a trimmed string or null. */
  private toNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }
}
