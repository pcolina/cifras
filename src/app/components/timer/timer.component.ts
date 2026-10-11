import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
})
export class TimerComponent {
  private timerService = inject(TimerService);

  timeRemaining = this.timerService.timeRemaining;
  elapsedTime = this.timerService.elapsedTime;
  totalTime = this.timerService.totalTime;
  isRunning = this.timerService.isRunning;
  noTimeLimit = this.timerService.noTimeLimit;

  progress = computed(() => {
    if (this.noTimeLimit()) {
      return 100; // Always full in no-limit mode
    }
    const total = this.totalTime();
    const remaining = this.timeRemaining();
    if (total === 0) return 100;
    return (remaining / total) * 100;
  });

  isLowTime = computed(() => {
    if (this.noTimeLimit()) return false;
    return this.timeRemaining() <= 10;
  });

  displayTime = computed(() => {
    if (this.noTimeLimit()) {
      return this.elapsedTime();
    }
    return this.timeRemaining();
  });

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
