import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { GameNumber } from '../../models/game.models';

type OperatorType = '+' | '-' | '*' | '/';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class CalculatorComponent {
  private gameService = inject(GameService);

  gameState = this.gameService.gameState;
  availableNumbers = this.gameService.availableNumbersForOperation;

  selectedNumber1 = signal<GameNumber | null>(null);
  selectedOperator = signal<OperatorType | null>(null);
  errorMessage = signal<string | null>(null);

  readonly operators: OperatorType[] = ['+', '-', '*', '/'];

  operatorLabels: Record<OperatorType, string> = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
  };

  currentExpression = computed(() => {
    const num1 = this.selectedNumber1();
    const op = this.selectedOperator();

    if (!num1) return '';
    if (!op) return `${num1.value}`;
    return `${num1.value} ${this.operatorLabels[op]}`;
  });

  isNumberSelected(num: GameNumber): boolean {
    return this.selectedNumber1()?.id === num.id;
  }

  selectNumber(num: GameNumber) {
    this.errorMessage.set(null);

    const num1 = this.selectedNumber1();
    const op = this.selectedOperator();

    if (!num1) {
      // First number selection
      this.selectedNumber1.set(num);
    } else if (!op) {
      // Changed first number selection
      this.selectedNumber1.set(num);
    } else {
      // Second number selection - perform operation
      if (num.id === num1.id) {
        // Can't use the same number twice
        this.errorMessage.set('No puedes usar el mismo número dos veces');
        return;
      }

      const success = this.gameService.performOperation(num1.id, num.id, op);

      if (success) {
        // Reset selection
        this.selectedNumber1.set(null);
        this.selectedOperator.set(null);
      } else {
        this.errorMessage.set('Operación no válida (resultado debe ser entero positivo)');
      }
    }
  }

  selectOperator(op: OperatorType) {
    this.errorMessage.set(null);

    if (!this.selectedNumber1()) {
      this.errorMessage.set('Selecciona primero un número');
      return;
    }

    this.selectedOperator.set(op);
  }

  isOperatorSelected(op: OperatorType): boolean {
    return this.selectedOperator() === op;
  }

  clearSelection() {
    this.selectedNumber1.set(null);
    this.selectedOperator.set(null);
    this.errorMessage.set(null);
  }

  undoLastOperation() {
    this.gameService.undoLastOperation();
    this.clearSelection();
  }

  canUndo(): boolean {
    return this.gameState().operations.length > 0;
  }
}
