import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.html',
  styleUrls: ['./filter-bar.css']
})
export class FilterBar {
  @Input() machines: string[] | null = [];
  @Input() indices: number[] | null = [];
  @Input() selectedMachines: string[] = []; 
  @Input() selectedIndices: number[] = [];

  @Output() machineChange = new EventEmitter<string[]>();
  @Output() indexChange = new EventEmitter<number[]>();

  isMachineOpen = false;
  isIndexOpen = false;

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Check if click is outside the component
    if (!target.closest('.dropdown-container')) {
      this.isMachineOpen = false;
      this.isIndexOpen = false;
    }
  }

  toggleMachineDropdown(event: Event) {
    event.stopPropagation(); // Prevent document click from closing immediately
    this.isMachineOpen = !this.isMachineOpen;
    this.isIndexOpen = false;
  }

  toggleIndexDropdown(event: Event) {
    event.stopPropagation(); // Prevent document click from closing immediately
    this.isIndexOpen = !this.isIndexOpen;
    this.isMachineOpen = false;
  }

  toggleMachine(machine: string, isChecked: boolean) {
    let current = [...this.selectedMachines];
    if (isChecked) {
      if (!current.includes(machine)) current.push(machine);
    } else {
      current = current.filter(m => m !== machine);
    }
    this.machineChange.emit(current);
  }

  isSelectedMachine(machine: string): boolean {
    return this.selectedMachines.includes(machine);
  }

  toggleIndex(index: number, isChecked: boolean) {
    let current = [...this.selectedIndices];
    
    if (isChecked) {
      if (!current.includes(index)) current.push(index);
    } else {
      current = current.filter(i => i !== index);
    }
    
    this.indexChange.emit(current);
  }

  isSelectedIndex(index: number): boolean {
    return this.selectedIndices.includes(index);
  }
}