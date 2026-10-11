import { Component, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { TimerService } from '../../services/timer.service';
import { SolverService } from '../../services/solver.service';
import { NumberSelectorComponent } from '../number-selector/number-selector.component';
import { TimerComponent } from '../timer/timer.component';
import { CalculatorComponent } from '../calculator/calculator.component';
import { SolutionDisplayComponent } from '../solution-display/solution-display.component';
import { SettingsComponent } from '../settings/settings.component';
import { TIME_OPTIONS } from '../../models/game.models';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    NumberSelectorComponent,
    TimerComponent,
    CalculatorComponent,
    SolutionDisplayComponent,
    SettingsComponent,
  ],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnDestroy {
  private gameService = inject(GameService);
  private timerService = inject(TimerService);
  private solverService = inject(SolverService);

  gameState = this.gameService.gameState;
  settings = this.gameService.gameSettings;
  showSettings = false;

  readonly timeOptions = TIME_OPTIONS;

  private timerEffect = effect(() => {
    const expired = this.timerService.timeExpired();
    const state = this.gameState();
    const noLimit = this.settings().noTimeLimit;

    // Only finish game on time expiry if there's a time limit
    if (expired && state.status === 'playing' && !noLimit) {
      this.onTimeUp();
    }
  });

  ngOnDestroy() {
    this.timerService.stop();
  }

  onTimeSelect(value: number, noLimit: boolean) {
    this.gameService.updateSettings({
      totalTime: value,
      noTimeLimit: noLimit,
    });
  }

  onStartGame() {
    this.gameService.startNewGame();
    const currentSettings = this.settings();

    if (currentSettings.noTimeLimit) {
      this.timerService.startNoLimit();
    } else {
      this.timerService.start(currentSettings.totalTime);
    }

    // Calculate best solution in background
    setTimeout(() => {
      const state = this.gameState();
      const numbers = state.availableNumbers.map((n) => n.value);
      this.solverService.solveAsync(numbers, state.targetNumber).then((solution) => {
        this.gameService.setBestSolution(solution);
      });
    }, 100);
  }

  onTimeUp() {
    this.timerService.stop();
    this.gameService.finishGame();
  }

  onGiveUp() {
    this.timerService.stop();
    this.gameService.finishGame();
  }

  onResetGame() {
    const currentSettings = this.settings();
    this.gameService.resetCurrentGame();

    if (currentSettings.noTimeLimit) {
      this.timerService.startNoLimit();
    } else {
      this.timerService.start(currentSettings.totalTime);
    }
  }

  onPlayAgain() {
    this.timerService.stop();
    this.gameService.resetToSetup();
  }

  openSettings() {
    this.showSettings = true;
  }

  closeSettings() {
    this.showSettings = false;
  }

  isTimeSelected(option: { value: number; noLimit: boolean }): boolean {
    const s = this.settings();
    if (option.noLimit) {
      return s.noTimeLimit;
    }
    return !s.noTimeLimit && s.totalTime === option.value;
  }
}
