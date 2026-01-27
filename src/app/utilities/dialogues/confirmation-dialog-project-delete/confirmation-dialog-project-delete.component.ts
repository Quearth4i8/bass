import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog-project-delete',
  templateUrl: 'confirmation-dialog-project-delete.component.html',
  styleUrls: ['confirmation-dialog-project-delete.component.scss'],
})
export class ConfirmationDialogProjectDeleteComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogProjectDeleteComponent>) {}
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
