import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { ProjectGroupService } from 'src/app/services/ProjectGroupService';
import { ProjectService } from 'src/app/services/ProjectService';

@Component({
  selector: 'app-dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.scss'],
})
export class DialogContentComponent implements OnInit {
  projectGroupTitles: string[] = [];
  projectFormData: any = {
    responsable: '',
    partenaire: '',
    thematique: '',
    programme: '',
    titreproj: '',
    acronyme: '',
    startyear: '',
    endyear:'',
    budget: '',
    title: ''
  };

  constructor(
    private projectGroupService: ProjectGroupService,
    private projectService: ProjectService,
    public ref: DynamicDialogRef,
  ) {}

  ngOnInit(): void {
    this.getProjectGroupTitles();
  }

  getProjectGroupTitles(): void {
    this.projectGroupService.getProjectGroupTitles().subscribe((titles) => {
      this.projectGroupTitles = titles;
    });
  }

  onSubmit() {
    this.projectService.createProject(this.projectFormData).subscribe(
      (response) => {
        console.log('Project created successfully:', response);
        this.ref.close('success');
      },
      (error) => {
        console.error('Error creating project:', error);
      }
    );
  }
}
