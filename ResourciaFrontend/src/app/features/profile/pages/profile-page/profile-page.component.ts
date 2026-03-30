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
export class ProfilePageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private currentUserId: string | null = null;
  private currentUserName: string | null = null;

  profile: ProfileViewModel | null = null;
  isLoading = true;
  isOwnProfile = false;
  activeTab: Tab = 'resources';

  readonly ROLE_LABELS: Record<UserRole, string> = {
    contributor: 'Contributor',
    educator: 'Educator',
    student: 'Student',
    admin: 'Admin',
    moderator: 'Moderator',
  };

  readonly ACTIVITY_ICONS: Record<ActivityType, string> = {
    shared_resource: '📤',
    wrote_review: '✍️',
    saved_resource: '🔖',
    joined: '🎉',
  };

  readonly ROLE_BADGE_CLASSES: Record<UserRole, string> = {
    educator: 'bg-cyan-500/20 text-cyan-200 ring-cyan-400/40',
    contributor: 'bg-blue-400/20 text-blue-100 ring-blue-300/40',
    student: 'bg-green-500/20 text-green-200 ring-green-400/40',
    admin: 'bg-red-500/20 text-red-200 ring-red-400/40',
    moderator: 'bg-violet-500/20 text-violet-200 ring-violet-400/40',
  };

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get tabs(): ProfileTab[] {
    if (!this.profile) {
      return [];
    }

    return [
      { key: 'resources', label: 'Resources', count: this.profile.sharedResources.length },
      { key: 'reviews', label: 'Reviews', count: this.profile.recentReviews.length },
      { key: 'activity', label: 'Activity', count: null },
    ];
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < Math.round(rating));
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  formatRelative(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  helpfulnessPercent(votes: number): number {
    return Math.min(100, Math.round((votes / 400) * 100));
  }

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
