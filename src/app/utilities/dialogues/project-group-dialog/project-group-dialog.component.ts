import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProjectGroupService } from 'src/app/services/ProjectGroupService';
import { ConfirmDeleteGroupDialogComponent } from '../confirm-delete-group-dialog/confirm-delete-group-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-project-group-dialog',
  templateUrl: './project-group-dialog.component.html',
  styleUrls: ['./project-group-dialog.component.scss']
})
export class ProjectGroupDialogComponent implements OnInit {
  projectGroupTitles: any[] = [];
  projectFormData: any = {
    title: '',
  };
  
  constructor(
    private projectGroupService: ProjectGroupService,
    public ref: DynamicDialogRef,
    public dialogService: DialogService,
    public dialog: MatDialog,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.getProjectGroupTitles();
  }

  getProjectGroupTitles(): void {
    this.projectGroupService.getProjectGroupTitles().subscribe((titles) => {
      this.projectGroupTitles = titles;
    });
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      this.projectGroupService.createProjectGroup(this.projectFormData).subscribe(
        (response) => {
          this.ref.close('success');
        },
        (error) => {
          console.error('Error creating project group:', error);
        }
      );
    }
  }

  onUpdate(title: string): void {
    console.log(`Update ${title}`);
    // Implement update logic as needed
  }

  // onDelete(title: string): void {
  //   console.log(`Delete ${title}`);

  //   this.projectGroupService.deleteProjectGroupByTitle(title).subscribe(
  //     () => {
  //       console.log(`Deleted project group: ${title}`);
  //       this.projectGroupTitles = this.projectGroupTitles.filter(groupTitle => groupTitle !== title);
  //     },
  //     (error) => {
  //       console.error('Error deleting project group:', error);
  //     }
  //   );
  // }
  onDelete(title: string): void {
    this.ref.close(); // Close the dialog before opening the confirmation dialog

    const dialogRef = this.dialog.open(ConfirmDeleteGroupDialogComponent, {
      width: '300px',
      panelClass: 'custom-dialog-container', // Apply custom dialog container styles
      backdropClass: 'custom-backdrop-class', // Apply custom backdrop styles
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${title}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.deleteItem(title);
      } else {
        this.ref = this.dialogService.open(ProjectGroupDialogComponent, {
          width: '50%'
        });
      }
    });
  }

  deleteItem(title: string): void {
    this.projectGroupService.deleteProjectGroupByTitle(title).subscribe(
      () => {
        console.log(`Deleted project group: ${title}`);
        this.projectGroupTitles = this.projectGroupTitles.filter(groupTitle => groupTitle !== title);
        this.ref = this.dialogService.open(ProjectGroupDialogComponent, {
          width: '50%'
        });
      },
    );
  }

}
