import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SearchResultResourceModel } from '../../../../../../shared/models/search-result-resource';

/**
 * Card view for a single resource in search results.
 */
@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [ButtonComponent, CommonModule, RouterLink],
  templateUrl: './resource-card.component.html',
  styleUrl: './resource-card.component.scss',
})
export class ResourceCardComponent {
  /** Resource data to render. */
  @Input() resource: SearchResultResourceModel | null = null;
  /** Emit when the user clicks to open the resource URL. */
  @Output() open = new EventEmitter<SearchResultResourceModel>();
  /** Emit when the user clicks to share the resource. */
  @Output() share = new EventEmitter<SearchResultResourceModel>();

  /** Router used to navigate to resource detail. */
  private router = inject(Router);

  /** Whether a non-empty description is available. */
  get hasDescription(): boolean {
    return !!this.resource?.description?.trim();
  }

  /** Display text for the description (fallback copy if empty). */
  get descriptionText(): string {
    return this.resource?.description?.trim() || 'No description yet — Add a one-sentence summary';
  }

  /** Tags displayed on the card (limited set). */
  get visibleTags(): string[] {
    return this.displayTags.slice(0, 3);
  }

  /** Count of hidden extra tags. */
  get extraTagCount(): number {
    return Math.max(this.displayTags.length - this.visibleTags.length, 0);
  }

  /** First letter for the avatar badge (from title or domain). */
  get logoLetter(): string {
    const title = this.resource?.title?.trim();
    if (title) {
      return title.charAt(0).toUpperCase();
    }

    const domain = this.resource?.url ? this.getDomain(this.resource.url) : '';
    return domain.charAt(0).toUpperCase() || 'R';
  }

  /** Display type label derived from facets or learning style. */
  get displayType(): string {
    const resource = this.resource;
    if (!resource) {
      return 'Resource';
    }

    const typeFacet = resource.facets.find((facet) =>
      ['type', 'resourcetype', 'resource-type', 'format'].includes(facet.key.toLowerCase())
    );

    if (typeFacet?.label?.trim()) {
      return typeFacet.label.trim();
    }

    if (resource.learningStyle?.trim()) {
      return resource.learningStyle.trim();
    }

    return 'Resource';
  }

  /** Display average rating or a "New" badge. */
  get ratingText(): string {
    const averageRating = this.resource?.ratings?.averageRating ?? 0;
    return averageRating > 0 ? averageRating.toFixed(1) : 'New';
  }

  /** Display review count string. */
  get ratingCountText(): string {
    const totalCount = this.resource?.ratings?.totalCount ?? 0;
    return totalCount > 0 ? `${totalCount} review${totalCount === 1 ? '' : 's'}` : 'No reviews yet';
  }

  /** Derive display tags from facets and explicit tags. */
  private get displayTags(): string[] {
    if (!this.resource) {
      return [];
    }

    const facetTags = this.resource.facets
      .filter((facet) => !['type', 'resourcetype', 'resource-type', 'format'].includes(facet.key.toLowerCase()))
      .map((facet) => facet.label?.trim() || facet.value?.trim())
      .filter((value): value is string => !!value);

    return [...new Set([...(this.resource.tags ?? []), ...facetTags])];
  }

  /** Extract a clean domain name from a URL. */
  getDomain(url: string): string {
    try {
      const formatted = url.startsWith('http') ? url : `https://${url}`;
      return new URL(formatted).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /** Navigate to the resource detail page. */
  goToDetail() {
    if (!this.resource?.id) {
      return;
    }

    this.router.navigate(['resource', this.resource.id]);
  }
}
