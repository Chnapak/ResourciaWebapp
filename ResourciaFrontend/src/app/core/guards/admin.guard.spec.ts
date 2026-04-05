import { TestBed } from '@angular/core/testing';
import { CanMatchFn, GuardResult, MaybeAsync, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { canActivateAdminGuard } from './admin.guard';

describe('canActivateAdminGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => canActivateAdminGuard(...guardParameters));

  const route: Route = {};
  const segments: UrlSegment[] = [];

  const setup = (isAdmin: boolean) => {
    const routerMock = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({} as UrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getUserInfo: () => of({ isAdmin }),
          },
        },
        {
          provide: Router,
          useValue: routerMock,
        },
      ],
    });

    return routerMock;
  };

  const resolveGuard = async (result: MaybeAsync<GuardResult>) => {
    if (isObservable(result)) {
      return await firstValueFrom(result);
    }
    return await Promise.resolve(result);
  };

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow admin', async () => {
    const routerMock = setup(true);

    const result = TestBed.runInInjectionContext(() => canActivateAdminGuard(route, segments));
    const allowed = await resolveGuard(result);

    expect(allowed).toBeTrue();
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should block non-admin', async () => {
    const routerMock = setup(false);

    const result = TestBed.runInInjectionContext(() => canActivateAdminGuard(route, segments));
    const resolved = await resolveGuard(result);

    expect(routerMock.createUrlTree).toHaveBeenCalled();
    expect(resolved).toBe(routerMock.createUrlTree.calls.mostRecent().returnValue);
  });
});
