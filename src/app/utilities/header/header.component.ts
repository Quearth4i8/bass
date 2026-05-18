import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/utilities/dialogues/confirm-dialog/confirm-dialog.component';
import { SidebarService } from 'src/app/services/sidebarservice';
import { Router } from '@angular/router';
@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss'],
})
export class HeaderComponent {
  constructor(private sidebarService: SidebarService,public dialog: MatDialog,private router: Router) {}

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
  openConfirmDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      disableClose: true,
      backdropClass: 'custom-backdrop-class',
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterOpened().subscribe(() => {
      document.body.classList.add('dialog-open');
    });

    dialogRef.afterClosed().subscribe(result => {
      document.body.classList.remove('dialog-open');
      if (result) {
        this.logout();
      }
    });
  }

  logout(): void {
    this.router.navigate(['/']);
    console.log('User logged out');
  }
}
