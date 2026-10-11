import { Injectable } from '@angular/core';
import { Operation, Solution } from '../models/game.models';

interface SolverState {
  numbers: number[];
  operations: Operation[];
}

@Injectable({
  providedIn: 'root',
})
export class SolverService {
  private bestSolution: Solution | null = null;
  private targetNumber = 0;
  private operationsCount = 0;
  private maxOperations = 100000; // Limit to prevent browser freeze

  solve(numbers: number[], target: number): Solution {
    this.bestSolution = null;
    this.targetNumber = target;
    this.operationsCount = 0;

    // Initial best: closest single number
    let closestNum = numbers[0];
    let minDiff = Math.abs(numbers[0] - target);

    for (const num of numbers) {
      const diff = Math.abs(num - target);
      if (diff < minDiff) {
        minDiff = diff;
        closestNum = num;
      }
    }

    this.bestSolution = {
      operations: [],
      result: closestNum,
      difference: minDiff,
      isExact: minDiff === 0,
    };

    // Start solving
    this.backtrack({
      numbers: [...numbers],
      operations: [],
    });

    return this.bestSolution;
  }

  private backtrack(state: SolverState): boolean {
    this.operationsCount++;

    // Safety limit
    if (this.operationsCount > this.maxOperations) {
      return this.bestSolution?.isExact ?? false;
    }

    // Check if we found exact solution
    if (this.bestSolution?.isExact) {
      return true;
    }

    const { numbers, operations } = state;

    // Check all numbers for best result so far
    for (const num of numbers) {
      const diff = Math.abs(num - this.targetNumber);
      if (
        !this.bestSolution ||
        diff < this.bestSolution.difference ||
        (diff === this.bestSolution.difference && operations.length < this.bestSolution.operations.length)
      ) {
        this.bestSolution = {
          operations: [...operations],
          result: num,
          difference: diff,
          isExact: diff === 0,
        };

        if (diff === 0) {
          return true;
        }
      }
    }

    // If only one number left, we can't do more operations
    if (numbers.length < 2) {
      return false;
    }

    // Try all pairs of numbers with all operations
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const a = numbers[i];
        const b = numbers[j];

        // Create new array without the two numbers we're using
        const remaining = numbers.filter((_, idx) => idx !== i && idx !== j);

        // Try all operations
        const ops: Array<{ op: '+' | '-' | '*' | '/'; result: number | null; n1: number; n2: number }> = [
          { op: '+', result: a + b, n1: a, n2: b },
          { op: '*', result: a * b, n1: a, n2: b },
        ];

        // Subtraction (both ways, only positive results)
        if (a > b) {
          ops.push({ op: '-', result: a - b, n1: a, n2: b });
        } else if (b > a) {
          ops.push({ op: '-', result: b - a, n1: b, n2: a });
        }

        // Division (both ways, only exact divisions)
        if (b !== 0 && a % b === 0) {
          ops.push({ op: '/', result: a / b, n1: a, n2: b });
        }
        if (a !== 0 && b % a === 0 && a !== b) {
          ops.push({ op: '/', result: b / a, n1: b, n2: a });
        }

        for (const { op, result, n1, n2 } of ops) {
          if (result === null || result <= 0) continue;

          const operation: Operation = {
            num1: n1,
            num2: n2,
            operator: op,
            result,
          };

          const found = this.backtrack({
            numbers: [...remaining, result],
            operations: [...operations, operation],
          });

          if (found) {
            return true;
          }
        }
      }
    }

    return false;
  }

  solveAsync(numbers: number[], target: number): Promise<Solution> {
    return new Promise((resolve) => {
      // Use setTimeout to not block the UI
      setTimeout(() => {
        const solution = this.solve(numbers, target);
        resolve(solution);
      }, 0);
    });
  }
}
