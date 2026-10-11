import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-number-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './number-selector.component.html',
  styleUrl: './number-selector.component.scss',
})
export class NumberSelectorComponent {
  private gameService = inject(GameService);

  settings = this.gameService.gameSettings;

  readonly options = [0, 1, 2, 3, 4];

  selectBigNumbers(count: number) {
    this.gameService.updateSettings({ bigNumbersCount: count });
  }

  getSmallCount(bigCount: number): number {
    return 6 - bigCount;
  }
}
