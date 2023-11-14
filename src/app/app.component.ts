import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private userSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        localStorage.setItem('lastRoute', event.urlAfterRedirects);
      });
  }

  ngOnInit(): void {
    this.getLastRoute();
  }

  getLastRoute() {
    setTimeout(() => {
      this.userSubscription = this.authService.user$.subscribe((user) => {
        this.ngZone.run(() => {
          if (user) {
            const lastRoute = localStorage.getItem('lastRoute');
            if (lastRoute !== '/login') {
              this.router.navigate([
                lastRoute || '/content/channel/DMoH03MTsuxcytK6BpUb',
              ]);
            } else {
              this.router.navigate(['/content/channel/DMoH03MTsuxcytK6BpUb']);
            }
          }
        });
      });
    }, 2400);
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }
}
