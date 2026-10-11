import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private gameService = inject(GameService);

  close = output<void>();

  settings = this.gameService.gameSettings;

  readonly timeOptions = [
    { value: 30, label: '30 segundos' },
    { value: 45, label: '45 segundos (TV)' },
    { value: 60, label: '1 minuto' },
    { value: 90, label: '1 minuto 30 seg' },
    { value: 120, label: '2 minutos' },
  ];

  updateTime(value: number) {
    this.gameService.updateSettings({ totalTime: value });
  }

  onClose() {
    this.close.emit();
  }
}
