import { Injectable, signal, computed } from '@angular/core';
import {
  GameState,
  GameNumber,
  Operation,
  GameSettings,
  DEFAULT_SETTINGS,
  BIG_NUMBERS,
  SMALL_NUMBERS,
  Solution,
} from '../models/game.models';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private state = signal<GameState>({
    status: 'setup',
    targetNumber: 0,
    availableNumbers: [],
    operations: [],
    currentResult: null,
    timeRemaining: DEFAULT_SETTINGS.totalTime,
    totalTime: DEFAULT_SETTINGS.totalTime,
    playerSolution: null,
    bestSolution: null,
    totalScore: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    initialNumbers: [],
  });

  private settings = signal<GameSettings>(DEFAULT_SETTINGS);

  // Public readonly signals
  readonly gameState = this.state.asReadonly();
  readonly gameSettings = this.settings.asReadonly();

  readonly availableNumbersForOperation = computed(() => {
    return this.state().availableNumbers.filter((n) => !n.used);
  });

  readonly isGameWon = computed(() => {
    const state = this.state();
    return state.status === 'won' || state.operations.some((op) => op.result === state.targetNumber);
  });

  updateSettings(newSettings: Partial<GameSettings>) {
    this.settings.update((s) => ({ ...s, ...newSettings }));
  }

  startNewGame() {
    const currentSettings = this.settings();
    const numbers = this.generateNumbers(currentSettings.bigNumbersCount);
    const target = this.generateTargetNumber();
    const timeValue = currentSettings.noTimeLimit ? 0 : currentSettings.totalTime;

    this.state.update((s) => ({
      ...s,
      status: 'playing',
      targetNumber: target,
      availableNumbers: numbers,
      operations: [],
      currentResult: null,
      timeRemaining: timeValue,
      totalTime: timeValue,
      playerSolution: null,
      bestSolution: null,
      initialNumbers: JSON.parse(JSON.stringify(numbers)), // Deep copy for reset
    }));
  }

  private generateNumbers(bigCount: number): GameNumber[] {
    const result: GameNumber[] = [];

    // Shuffle and pick big numbers
    const shuffledBig = [...BIG_NUMBERS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < bigCount && i < shuffledBig.length; i++) {
      result.push({
        value: shuffledBig[i],
        id: `big-${i}-${Date.now()}`,
        used: false,
        isResult: false,
      });
    }

    // Shuffle and pick small numbers
    const shuffledSmall = [...SMALL_NUMBERS].sort(() => Math.random() - 0.5);
    const smallCount = 6 - bigCount;
    for (let i = 0; i < smallCount; i++) {
      result.push({
        value: shuffledSmall[i],
        id: `small-${i}-${Date.now()}`,
        used: false,
        isResult: false,
      });
    }

    return result;
  }

  private generateTargetNumber(): number {
    return Math.floor(Math.random() * 900) + 100; // 100-999
  }

  performOperation(num1Id: string, num2Id: string, operator: '+' | '-' | '*' | '/'): boolean {
    const currentState = this.state();
    const n1 = currentState.availableNumbers.find((n) => n.id === num1Id);
    const n2 = currentState.availableNumbers.find((n) => n.id === num2Id);

    if (!n1 || !n2 || n1.used || n2.used) {
      return false;
    }

    const result = this.calculateResult(n1.value, n2.value, operator);

    // Invalid operation (division not exact, negative result, etc.)
    if (result === null) {
      return false;
    }

    const operation: Operation = {
      num1: n1.value,
      num2: n2.value,
      operator,
      result,
    };

    // Create new number from result
    const resultNumber: GameNumber = {
      value: result,
      id: `result-${Date.now()}-${Math.random()}`,
      used: false,
      isResult: true,
    };

    this.state.update((s) => ({
      ...s,
      availableNumbers: [
        ...s.availableNumbers.map((n) => (n.id === num1Id || n.id === num2Id ? { ...n, used: true } : n)),
        resultNumber,
      ],
      operations: [...s.operations, operation],
      currentResult: result,
    }));

    // Check if player won
    if (result === currentState.targetNumber) {
      this.winGame();
    }

    return true;
  }

  private calculateResult(a: number, b: number, op: '+' | '-' | '*' | '/'): number | null {
    let result: number;

    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        // No negative results allowed
        if (result <= 0) return null;
        break;
      case '*':
        result = a * b;
        break;
      case '/':
        // Must be exact division
        if (b === 0 || a % b !== 0) return null;
        result = a / b;
        break;
    }

    return result;
  }

  undoLastOperation() {
    const currentState = this.state();
    if (currentState.operations.length === 0) return;

    const lastOp = currentState.operations[currentState.operations.length - 1];

    this.state.update((s) => {
      // Find and remove the result number
      const newNumbers = s.availableNumbers
        .filter((n) => !(n.isResult && n.value === lastOp.result))
        .map((n) => {
          // Un-use the original numbers
          if (n.value === lastOp.num1 || n.value === lastOp.num2) {
            // Find the first matching used number to un-use
            const matchingUsed = s.availableNumbers.find(
              (x) => x.value === n.value && x.used && x.id === n.id
            );
            if (matchingUsed) {
              return { ...n, used: false };
            }
          }
          return n;
        });

      return {
        ...s,
        availableNumbers: newNumbers,
        operations: s.operations.slice(0, -1),
        currentResult: s.operations.length > 1 ? s.operations[s.operations.length - 2].result : null,
      };
    });
  }

  updateTimeRemaining(time: number) {
    this.state.update((s) => ({ ...s, timeRemaining: time }));
  }

  // Called when player wins (gets exact number)
  winGame() {
    const points = 10; // Full points for exact match
    this.state.update((s) => ({
      ...s,
      status: 'won',
      totalScore: s.totalScore + points,
      gamesPlayed: s.gamesPlayed + 1,
      gamesWon: s.gamesWon + 1,
      playerSolution: {
        operations: [...s.operations],
        result: s.targetNumber,
        difference: 0,
        isExact: true,
      },
    }));
  }

  // Called when time runs out or player gives up
  finishGame() {
    const state = this.state();
    if (state.status === 'won') return; // Already won, don't override

    const playerResult = this.getCurrentPlayerResult();
    let points = 0;

    if (playerResult !== null) {
      const diff = Math.abs(playerResult - state.targetNumber);
      if (diff === 0) {
        points = 10;
      } else if (diff <= 5) {
        points = 7;
      } else if (diff <= 10) {
        points = 5;
      }
    }

    const playerSolution: Solution | null = playerResult
      ? {
          operations: [...state.operations],
          result: playerResult,
          difference: Math.abs(playerResult - state.targetNumber),
          isExact: playerResult === state.targetNumber,
        }
      : null;

    this.state.update((s) => ({
      ...s,
      status: 'finished',
      totalScore: s.totalScore + points,
      gamesPlayed: s.gamesPlayed + 1,
      gamesWon: playerResult === s.targetNumber ? s.gamesWon + 1 : s.gamesWon,
      playerSolution,
    }));
  }

  setPlayerSolution(solution: Solution) {
    this.state.update((s) => ({ ...s, playerSolution: solution }));
  }

  setBestSolution(solution: Solution) {
    this.state.update((s) => ({ ...s, bestSolution: solution }));
  }

  // Reset current game with same numbers and target
  resetCurrentGame() {
    const currentSettings = this.settings();
    const timeValue = currentSettings.noTimeLimit ? 0 : currentSettings.totalTime;

    this.state.update((s) => ({
      ...s,
      status: 'playing',
      availableNumbers: JSON.parse(JSON.stringify(s.initialNumbers)),
      operations: [],
      currentResult: null,
      timeRemaining: timeValue,
      playerSolution: null,
    }));
  }

  resetToSetup() {
    this.state.update((s) => ({
      ...s,
      status: 'setup',
      availableNumbers: [],
      operations: [],
      currentResult: null,
      playerSolution: null,
      bestSolution: null,
      initialNumbers: [],
    }));
  }

  getCurrentPlayerResult(): number | null {
    const state = this.state();
    const availableResults = state.availableNumbers.filter((n) => !n.used);

    if (availableResults.length === 0) return null;

    // Find the closest result to target
    let closest = availableResults[0].value;
    let minDiff = Math.abs(closest - state.targetNumber);

    for (const num of availableResults) {
      const diff = Math.abs(num.value - state.targetNumber);
      if (diff < minDiff) {
        minDiff = diff;
        closest = num.value;
      }
    }

    return closest;
  }

  // Reset all scores
  resetScores() {
    this.state.update((s) => ({
      ...s,
      totalScore: 0,
      gamesPlayed: 0,
      gamesWon: 0,
    }));
  }
}
