import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-dialog-detail-view-uploaded-datas',
  templateUrl: './dialog-detail-view-uploaded-datas.component.html',
  styleUrls: ['./dialog-detail-view-uploaded-datas.component.scss']
})


export class DialogDetailViewUploadedDatasComponent {


  constructor(@Inject(MAT_DIALOG_DATA) public data: { uploadedImageUrl: string }) {

  }
}
