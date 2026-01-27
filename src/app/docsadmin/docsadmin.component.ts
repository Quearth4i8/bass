import { Component } from '@angular/core';
import { SidebarService } from '../services/sidebarservice';

@Component({
  selector: 'app-docsadmin',
  templateUrl: 'docsadmin.component.html',
  styleUrls: ['docsadmin.component.scss'],
})
export class DocsadminComponent {

  isSidebarVisible = true;
  
  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.sidebarService.sidebarVisibility$.subscribe((isVisible) => {
      console.log(isVisible)
      this.isSidebarVisible = isVisible;
    });
  }
  onUpload(event: any): void {
    for (const file of event.files) {
      console.log('File uploaded:', file);
    }
  }
}
