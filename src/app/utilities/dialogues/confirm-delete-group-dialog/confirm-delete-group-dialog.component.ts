import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete-group-dialog',
  templateUrl: './confirm-delete-group-dialog.component.html',
  styleUrls: ['./confirm-delete-group-dialog.component.scss']
})
export class ConfirmDeleteGroupDialogComponent {

  constructor(public dialogRef: MatDialogRef<ConfirmDeleteGroupDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close('cancel');
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }
}
