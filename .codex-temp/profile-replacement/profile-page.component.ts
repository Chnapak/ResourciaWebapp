import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// ─────────────────────────────────────────────────────────────────────────────
// View-model types
// Swap mock data for a ProfileService call when the backend API is ready.
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole     = 'contributor' | 'educator' | 'student' | 'admin' | 'moderator';
export type ActivityType = 'shared_resource' | 'wrote_review' | 'saved_resource' | 'joined';
export type Tab          = 'resources' | 'reviews' | 'activity';

export interface ProfileResource {
  id: string;
  title: string;
  domain: string;
  type: string;
  rating: number;
  ratingCount: number;
  saves: number;
  addedAt: string;
}

export interface ProfileReview {
  id: string;
  resourceTitle: string;
  resourceId: string;
  rating: number;
  body: string;
  helpful: number;
  notHelpful: number;
  postedAt: string;
}

export interface ProfileActivity {
  id: string;
  type: ActivityType;
  description: string;
  target?: string;
  targetId?: string;
  timestamp: string;
}

export interface ProfileStats {
  resourcesShared: number;
  reviewsWritten: number;
  helpfulVotes: number;
  resourcesSaved: number;
}

export interface ProfileViewModel {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarInitials: string;
  role: UserRole;
  isVerified: boolean;
  joinedAt: string;
  lastActive: string;
  location?: string;
  website?: string;
  interests: string[];
  stats: ProfileStats;
  sharedResources: ProfileResource[];
  recentReviews: ProfileReview[];
  recentActivity: ProfileActivity[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — replace with real API call in loadProfile()
// ─────────────────────────────────────────────────────────────────────────────

function buildMockProfile(id: string): ProfileViewModel {
  return {
    id,
    name: 'Martin Novák',
    handle: 'mnovak',
    bio: 'CS teacher at a Prague secondary school. Collecting the best resources for programming fundamentals, web dev, and computational thinking since 2019.',
    avatarInitials: 'MN',
    role: 'educator',
    isVerified: true,
    joinedAt: '2021-09-03',
    lastActive: '2026-03-28',
    location: 'Prague, Czech Republic',
    website: 'novak.dev',
    interests: ['Web Development', 'Python', 'CS Education', 'Algorithms', 'Open Source'],
    stats: {
      resourcesShared: 47,
      reviewsWritten: 83,
      helpfulVotes: 312,
      resourcesSaved: 120,
    },
    sharedResources: [
      { id: 'r1', title: 'W3Schools', domain: 'w3schools.com', type: 'Reference', rating: 5.0, ratingCount: 1, saves: 0, addedAt: '2026-03-28' },
      { id: 'r2', title: 'CS50 by Harvard', domain: 'cs50.harvard.edu', type: 'Course', rating: 4.9, ratingCount: 214, saves: 88, addedAt: '2024-11-10' },
      { id: 'r3', title: 'The Odin Project', domain: 'theodinproject.com', type: 'Curriculum', rating: 4.8, ratingCount: 97, saves: 43, addedAt: '2024-08-22' },
    ],
    recentReviews: [
      {
        id: 'rv1', resourceTitle: 'freeCodeCamp', resourceId: 'fc1', rating: 4,
        body: 'Great structured curriculum for absolute beginners. The projects make it click. Could use more depth on CS theory, but excellent for practical skills.',
        helpful: 24, notHelpful: 2, postedAt: '2026-03-20',
      },
      {
        id: 'rv2', resourceTitle: 'MDN Web Docs', resourceId: 'mdn1', rating: 5,
        body: 'The reference I point every student to first. Authoritative, up-to-date, and surprisingly readable once you know how to navigate it.',
        helpful: 41, notHelpful: 0, postedAt: '2026-02-14',
      },
    ],
    recentActivity: [
      { id: 'a1', type: 'shared_resource', description: 'Shared a new resource', target: 'W3Schools',         targetId: 'r1',   timestamp: '2026-03-28' },
      { id: 'a2', type: 'wrote_review',    description: 'Wrote a review for',     target: 'freeCodeCamp',    targetId: 'fc1',  timestamp: '2026-03-20' },
      { id: 'a3', type: 'saved_resource',  description: 'Saved',                  target: 'Eloquent JavaScript', targetId: 'ej1', timestamp: '2026-03-12' },
      { id: 'a4', type: 'wrote_review',    description: 'Wrote a review for',     target: 'MDN Web Docs',    targetId: 'mdn1', timestamp: '2026-02-14' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profile: ProfileViewModel | null = null;
  isLoading = true;
  isOwnProfile = false; // TODO: compare route :id against auth/me id
  activeTab: Tab = 'resources';

  readonly ROLE_LABELS: Record<UserRole, string> = {
    contributor: 'Contributor',
    educator:    'Educator',
    student:     'Student',
    admin:       'Admin',
    moderator:   'Moderator',
  };

  readonly ACTIVITY_ICONS: Record<ActivityType, string> = {
    shared_resource: '📤',
    wrote_review:    '✍️',
    saved_resource:  '🔖',
    joined:          '🎉',
  };

  // Tailwind classes per role badge — must be full strings for Tailwind's JIT scanner
  readonly ROLE_BADGE_CLASSES: Record<UserRole, string> = {
    educator:    'bg-cyan-500/20 text-cyan-200 ring-cyan-400/40',
    contributor: 'bg-blue-400/20 text-blue-100 ring-blue-300/40',
    student:     'bg-green-500/20 text-green-200 ring-green-400/40',
    admin:       'bg-red-500/20 text-red-200 ring-red-400/40',
    moderator:   'bg-violet-500/20 text-violet-200 ring-violet-400/40',
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id') ?? 'me';
        this.loadProfile(id);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  formatRelative(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30)  return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  helpfulnessPercent(votes: number): number {
    return Math.min(100, Math.round((votes / 400) * 100));
  }

  // ── API seam ──────────────────────────────────────────────────────────────
  // TODO: Replace with injected service:
  //   this.profileService.getById(id)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({ next: p => { this.profile = p; this.isLoading = false; }, error: () => { ... } });
  private loadProfile(id: string): void {
    this.isLoading = true;
    setTimeout(() => {
      this.profile   = buildMockProfile(id);
      this.isLoading = false;
    }, 550);
  }
}
