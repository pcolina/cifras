import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-solution-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solution-display.component.html',
  styleUrl: './solution-display.component.scss',
})
export class SolutionDisplayComponent {
  private gameService = inject(GameService);

  gameState = this.gameService.gameState;

  operatorLabels: Record<string, string> = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
  };

  playerWon = computed(() => {
    const state = this.gameState();
    return state.playerSolution?.isExact ?? false;
  });

  playerDifference = computed(() => {
    const state = this.gameState();
    return state.playerSolution?.difference ?? null;
  });

  showBestSolution = computed(() => {
    const state = this.gameState();
    // Show best solution if player didn't get exact or didn't get the best possible
    if (!state.bestSolution) return false;
    if (!state.playerSolution) return true;

    return state.playerSolution.difference > state.bestSolution.difference;
  });

  getResultMessage(): string {
    const state = this.gameState();

    if (state.playerSolution?.isExact) {
      return '¡EXACTO!';
    }

    if (state.playerSolution) {
      const diff = state.playerSolution.difference;
      if (diff <= 5) return '¡MUY CERCA!';
      if (diff <= 10) return '¡BUEN INTENTO!';
      return 'TIEMPO AGOTADO';
    }

    return 'TIEMPO AGOTADO';
  }

  getPoints(): number {
    const state = this.gameState();

    if (!state.playerSolution) return 0;

    if (state.playerSolution.isExact) {
      return 10;
    }

    const diff = state.playerSolution.difference;
    if (diff <= 5) return 7;
    if (diff <= 10) return 5;

    return 0;
  }
}
