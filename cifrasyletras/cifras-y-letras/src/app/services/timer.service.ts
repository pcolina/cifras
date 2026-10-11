import { Injectable, signal } from '@angular/core';
import { interval, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private subscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  readonly timeRemaining = signal<number>(0);
  readonly elapsedTime = signal<number>(0);
  readonly totalTime = signal<number>(45);
  readonly isRunning = signal<boolean>(false);
  readonly timeExpired = signal<boolean>(false);
  readonly noTimeLimit = signal<boolean>(false);

  // Start countdown mode (with limit)
  start(totalSeconds: number) {
    this.stop();

    this.noTimeLimit.set(false);
    this.totalTime.set(totalSeconds);
    this.timeRemaining.set(totalSeconds);
    this.elapsedTime.set(0);
    this.isRunning.set(true);
    this.timeExpired.set(false);

    this.destroy$ = new Subject<void>();

    this.subscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const current = this.timeRemaining();
        this.elapsedTime.update((e) => e + 1);

        if (current > 0) {
          this.timeRemaining.set(current - 1);
        }

        if (current <= 1) {
          this.timeExpired.set(true);
          this.stop();
        }
      });
  }

  // Start count-up mode (no limit)
  startNoLimit() {
    this.stop();

    this.noTimeLimit.set(true);
    this.totalTime.set(0);
    this.timeRemaining.set(0);
    this.elapsedTime.set(0);
    this.isRunning.set(true);
    this.timeExpired.set(false);

    this.destroy$ = new Subject<void>();

    this.subscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.elapsedTime.update((e) => e + 1);
        this.timeRemaining.update((t) => t + 1); // Count up
      });
  }

  stop() {
    if (this.subscription) {
      this.destroy$.next();
      this.destroy$.complete();
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.isRunning.set(false);
  }

  pause() {
    if (this.subscription) {
      this.destroy$.next();
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.isRunning.set(false);
  }

  resume() {
    if (this.isRunning()) return;

    this.destroy$ = new Subject<void>();
    this.isRunning.set(true);

    if (this.noTimeLimit()) {
      // Resume count-up mode
      this.subscription = interval(1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.elapsedTime.update((e) => e + 1);
          this.timeRemaining.update((t) => t + 1);
        });
    } else {
      // Resume countdown mode
      if (this.timeRemaining() <= 0) return;

      this.subscription = interval(1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          const current = this.timeRemaining();
          this.elapsedTime.update((e) => e + 1);

          if (current > 0) {
            this.timeRemaining.set(current - 1);
          }

          if (current <= 1) {
            this.timeExpired.set(true);
            this.stop();
          }
        });
    }
  }

  reset(totalSeconds?: number, isNoLimit?: boolean) {
    this.stop();

    if (isNoLimit !== undefined) {
      this.noTimeLimit.set(isNoLimit);
    }

    if (this.noTimeLimit()) {
      this.totalTime.set(0);
      this.timeRemaining.set(0);
    } else if (totalSeconds !== undefined) {
      this.totalTime.set(totalSeconds);
      this.timeRemaining.set(totalSeconds);
    } else {
      this.timeRemaining.set(this.totalTime());
    }

    this.elapsedTime.set(0);
    this.timeExpired.set(false);
  }

  getProgress(): number {
    if (this.noTimeLimit()) {
      return 100; // Always full in no-limit mode
    }
    const total = this.totalTime();
    const remaining = this.timeRemaining();
    if (total === 0) return 100;
    return (remaining / total) * 100;
  }
}
