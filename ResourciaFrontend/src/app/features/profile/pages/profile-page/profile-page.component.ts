/**
 * Public profile page with tabs for resources, reviews, and activity.
 */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProfileService } from '../../../../core/services/profile.service';
import {
  ActivityType,
  ProfileTab,
  ProfileViewModel,
  Tab,
  UserRole,
} from '../../models/profile.model';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
/**
 * Fetches and renders a user's public profile with tabbed content.
 */
export class ProfilePageComponent implements OnInit, OnDestroy {
  /** Emits on destroy to clean up subscriptions. */
  private readonly destroy$ = new Subject<void>();

  /** Current logged-in user id for ownership checks. */
  private currentUserId: string | null = null;
  /** Current logged-in user name for ownership checks. */
  private currentUserName: string | null = null;

  /** Loaded profile data. */
  profile: ProfileViewModel | null = null;
  /** Whether the profile is loading. */
  isLoading = true;
  /** Whether the profile belongs to the current user. */
  isOwnProfile = false;
  /** Currently active tab. */
  activeTab: Tab = 'resources';

  /** Display labels for user roles. */
  readonly ROLE_LABELS: Record<UserRole, string> = {
    contributor: 'Contributor',
    educator: 'Educator',
    student: 'Student',
    admin: 'Admin',
    moderator: 'Moderator',
  };

  /** Emoji icons for activity types. */
  readonly ACTIVITY_ICONS: Record<ActivityType, string> = {
    shared_resource: '📤',
    wrote_review: '✍️',
    saved_resource: '🔖',
    joined: '🎉',
  };

  /** CSS class map for role badges. */
  readonly ROLE_BADGE_CLASSES: Record<UserRole, string> = {
    educator: 'bg-cyan-500/20 text-cyan-200 ring-cyan-400/40',
    contributor: 'bg-blue-400/20 text-blue-100 ring-blue-300/40',
    student: 'bg-green-500/20 text-green-200 ring-green-400/40',
    admin: 'bg-red-500/20 text-red-200 ring-red-400/40',
    moderator: 'bg-violet-500/20 text-violet-200 ring-violet-400/40',
  };

  /** Creates the page with routing and profile services. */
  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

  /** Subscribes to user and route changes to load the profile. */
  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUserId = user?.id ?? null;
        this.currentUserName = user?.name ?? null;
        this.syncOwnProfileFlag();
      });

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const identifier = params.get('username') ?? params.get('id') ?? 'me';
        this.loadProfile(identifier);
      });
  }

  /** Cleans up subscriptions. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Tabs derived from the current profile. */
  get tabs(): ProfileTab[] {
    if (!this.profile) {
      return [];
    }

    return [
      { key: 'resources', label: 'Resources', count: this.profile.stats.resourcesShared },
      { key: 'reviews', label: 'Reviews', count: this.profile.stats.reviewsWritten },
      { key: 'saved', label: 'Saved', count: this.profile.stats.resourcesSaved },
      { key: 'activity', label: 'Activity', count: null },
    ];
  }

  /** Switches the active tab. */
  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  /** Builds a 5-star boolean array for rating display. */
  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < Math.round(rating));
  }

  /** Formats an ISO timestamp for display. */
  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /** Formats an ISO timestamp as a relative label. */
  formatRelative(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  /** Converts helpful votes into a percentage bar value. */
  helpfulnessPercent(votes: number): number {
    return Math.min(100, Math.round((votes / 400) * 100));
  }

  /** Loads profile data for the given identifier. */
  private loadProfile(identifier: string): void {
    this.isLoading = true;

    this.profileService.getProfile(identifier)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.activeTab = 'resources';
          this.isLoading = false;
          document.title = profile.name;
          this.syncOwnProfileFlag();
        },
        error: () => {
          this.profile = null;
          this.isOwnProfile = false;
          this.isLoading = false;
          document.title = 'Profile';
        }
      });
  }

  /** Updates the `isOwnProfile` flag based on current user info. */
  private syncOwnProfileFlag(): void {
    if (!this.profile) {
      this.isOwnProfile = false;
      return;
    }

    const sameId = this.currentUserId === this.profile.id;
    const sameName = this.currentUserName?.toLowerCase() === this.profile.name.toLowerCase();
    this.isOwnProfile = sameId || sameName;
  }
}
