import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  // --- Data Inputs (Can be null due to async pipe) ---
  @Input() machines: string[] | null = [];
  @Input() indices: number[] | null = [];

  // --- State Inputs ---
  // Multi-select uses an array. Empty array [] means "All Machines"
  @Input() selectedMachines: string[] = []; 
  
  // Single-select uses number or null
  @Input() selectedIndex: number | null = null;

  // --- Outputs ---
  // strictly emit string[] so it matches the Dashboard's BehaviorSubject<string[]>
  @Output() machineChange = new EventEmitter<string[]>();
  @Output() indexChange = new EventEmitter<number | null>();

  /**
   * Toggles a machine in the multi-select list.
   * If the machine is already selected, remove it.
   * If not, add it.
   * Always emits a new array.
   */
  toggleMachine(machine: string, isChecked: boolean) {
    // 1. Create a copy of the current array to avoid mutating the input directly
    let currentSelection = [...this.selectedMachines];

    if (isChecked) {
      // Add if not present
      if (!currentSelection.includes(machine)) {
        currentSelection.push(machine);
      }
    } else {
      // Remove if present
      currentSelection = currentSelection.filter(m => m !== machine);
    }
    
    // 2. Emit the new array (Empty array = All Machines)
    this.machineChange.emit(currentSelection);
  }

  /**
   * Helper for the template to check if a checkbox should be checked.
   */
  isSelected(machine: string): boolean {
    return this.selectedMachines.includes(machine);
  }

  /**
   * Handled by the standard <select> change event for Indices
   */
  onIndexSelect(): void {
    this.indexChange.emit(this.selectedIndex);
  }
}