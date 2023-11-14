import { Injectable } from '@angular/core';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  deleteObject,
  getStorage,
} from '@angular/fire/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { MessageService } from 'src/app/shared/services/message.service';
import { Router } from '@angular/router';
import { User } from 'src/app/shared/services/user';
import { MessageContent } from 'src/app/models/message';
import { Observable, Subject, of } from 'rxjs';
import { DialogDataUploadSuccessfulComponent } from 'src/app/components/dialog-data-upload-successful/dialog-data-upload-successful.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogUploadedDataErrorComponent } from 'src/app/components/dialog-uploaded-data-error/dialog-uploaded-data-error.component';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  threadAreClosed: boolean = false;
  loggedInUser: User | null = null;
  currentChannelName!: string;
  file: any = {};
  uploadedImages: any = [];
  uploadedDatas: any = [];
  pattern: RegExp = /.pdf/;
  urlContainsPdfEnding: boolean = false;
  filteredUrlToString: string = '';
  uploadedFileURL = new Subject<{ url: string; type: 'image' | 'data' }>();

  constructor(
    public channelService: ChannelService,
    private router: Router,
    private messageService: MessageService,
    public storage: Storage,
    public dialog: MatDialog,
    public sanitizer: DomSanitizer
  ) {}

  setChannelName(name: string): void {
    this.currentChannelName = name;
  }

  resetChannelName(): void {
    this.currentChannelName = '';
  }

  openDirectMessageThread(messageId: string, selectedUserId: string) {
    this.threadAreClosed = true;
    this.resetChannelName();
    this.router.navigate([
      '/content',
      'direct-message',
      selectedUserId,
      'thread',
      messageId,
    ]);
  }

  openChannelThread(messageId: string, channelId: string, channelName: string) {
    this.threadAreClosed = true;
    this.setChannelName(channelName);
    this.router.navigate([
      '/content',
      'channel',
      channelId,
      'thread',
      messageId,
      channelId,
    ]);
  }

  loadThreadData(
    messageId: string,
    channelId?: string | null
  ): Observable<MessageContent | null> {
    if (channelId && messageId) {
      return this.messageService.getChannelMessageById(channelId, messageId);
    }
    return of(null);
  }

  chooseFileSevice($event: any) {
    this.file = $event.target.files[0];
    this.uploadDataService();
  }

  chooseThreadFileSevice($event: any) {
    this.file = $event.target.files[0];
    this.uploadDataService();
  }

  uploadDataService() {
    const storageRef = ref(this.storage, `images/${this.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, this.file);
    if (this.dataSizeIsRightService() && this.dataFormatIsRightService()) {
      this.dataUploadIsInProgressService(uploadTask);
    } else {
      uploadTask.cancel();
      this.dialog.open(DialogUploadedDataErrorComponent);
    }
  }

  fileTypeService(fileName: string): 'image' | 'data' {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    return imageExtensions.includes(fileExtension || '') ? 'image' : 'data';
  }

  dataSizeIsRightService() {
    return this.file.size <= 500000;
  }

  dataFormatIsRightService() {
    return (
      this.file.type == 'image/jpeg' ||
      this.file.type == 'image/png' ||
      this.file.type == 'application/pdf'
    );
  }

  dataUploadIsInProgressService(uploadTask: any) {
    uploadTask.on(
      'state_changed',
      (data: any) => {
        const progress = (data.bytesTransferred / data.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error: Error) => {
        console.log(error.message);
      },
      () => {
        this.getTheDownloadUrlService(uploadTask).then((url) => {
          const fileType: 'image' | 'data' = url.endsWith('.jpg')
            ? 'image'
            : 'data';
          this.uploadedFileURL.next({ url, type: fileType });
        });
      }
    );
  }

  getTheDownloadUrlService(uploadTask: any): Promise<string> {
    return getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
      if (this.file.type == 'image/jpeg' || this.file.type == 'image/png') {
        this.uploadedImages.push(downloadURL);
      } else {
        this.uploadedDatas.push(
          this.sanitizer.bypassSecurityTrustResourceUrl(downloadURL)
        );
      }
      this.dialog.open(DialogDataUploadSuccessfulComponent);
      return downloadURL;
    });
  }

  deleteUploadedDataService(uploadedDataUrl: string, index: number) {
    this.urlContainsPdfEnding = this.pattern.test(
      JSON.stringify(uploadedDataUrl)
    );
    if (this.urlContainsPdfEnding) {
      this.deletePdfDataService(uploadedDataUrl, index);
    } else {
      this.deleteImagesService(uploadedDataUrl, index);
    }
  }

  deleteFileFromStorage(url: string): Promise<void> {
    const storage = getStorage();
    const fileRef = ref(storage, url);

    return getDownloadURL(fileRef)
      .then(() => {
        return deleteObject(fileRef);
      })
      .catch((error) => {
        console.error('Error deleting file from storage:', error);
        throw error;
      });
  }

  deletePdfDataService(uploadedDataUrl: string, index: number) {
    this.filteredUrlToString = JSON.stringify(uploadedDataUrl)
      .substring(42)
      .replace('"}', '');
    const storageRef = ref(this.storage, this.filteredUrlToString);
    deleteObject(storageRef).then(() => {
      this.uploadedDatas.splice(index, 1);
    });
  }

  deleteImagesService(uploadedDataUrl: string, index: number) {
    const storageRef = ref(this.storage, uploadedDataUrl);
    deleteObject(storageRef).then(() => {
      this.uploadedImages.splice(index, 1);
    });
  }

  clearUploadedFiles() {
    this.uploadedImages = [];
    this.uploadedDatas = [];
  }

  closeThreadService() {
    this.threadAreClosed = false;
  }
}
