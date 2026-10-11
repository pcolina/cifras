export interface Operation {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*' | '/';
  result: number;
}

export interface GameNumber {
  value: number;
  id: string;
  used: boolean;
  isResult: boolean; // true if this number came from an operation result
}

export interface Solution {
  operations: Operation[];
  result: number;
  difference: number;
  isExact: boolean;
}

export interface GameState {
  status: 'setup' | 'playing' | 'finished' | 'won';
  targetNumber: number;
  availableNumbers: GameNumber[];
  operations: Operation[];
  currentResult: number | null;
  timeRemaining: number;
  totalTime: number;
  playerSolution: Solution | null;
  bestSolution: Solution | null;
  totalScore: number; // Accumulated score across games
  gamesPlayed: number;
  gamesWon: number;
  // For reset functionality
  initialNumbers: GameNumber[];
}

export interface GameSettings {
  totalTime: number; // in seconds, 0 means no limit
  bigNumbersCount: number; // 0-4
  noTimeLimit: boolean; // if true, timer counts up and game doesn't end on time
}

export const DEFAULT_SETTINGS: GameSettings = {
  totalTime: 45,
  bigNumbersCount: 2,
  noTimeLimit: false,
};

export const TIME_OPTIONS = [
  { value: 0, label: 'Sin límite', noLimit: true },
  { value: 30, label: '30 segundos', noLimit: false },
  { value: 45, label: '45 segundos (TV)', noLimit: false },
  { value: 60, label: '1 minuto', noLimit: false },
  { value: 90, label: '1:30 minutos', noLimit: false },
  { value: 120, label: '2 minutos', noLimit: false },
];

export const BIG_NUMBERS = [25, 50, 75, 100];
export const SMALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
