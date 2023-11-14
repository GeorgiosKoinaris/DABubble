import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from 'src/app/shared/services/storage.service';
import { DialogDetailViewUploadedDatasComponent } from '../dialog-detail-view-uploaded-datas/dialog-detail-view-uploaded-datas.component';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MessageService } from 'src/app/shared/services/message.service';
import { QuillService } from 'src/app/shared/services/quill.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-message',
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss'],
})
export class NewMessageComponent implements OnInit, OnDestroy {
  dropDownMenuUserIsOpen: boolean = false;
  users: { user: any; unreadCount?: number }[] = [];
  isOnline?: boolean;
  foundUsers: any[] = [];
  messageContent: string = '';
  selectedChannelId: string | null = null;
  selectedUserId: string | null = null;
  selectedChannelIdSubscription!: Subscription;
  selectedUserIdSubscription!: Subscription;
  newMessageQuillInstance: any;
  uploadedFiles: { url: string; type: 'image' | 'data' }[] = [];
  messageContainerError: boolean = false;
  subscription!: Subscription;
  @ViewChild('newMessagQuill', { static: false, read: ElementRef })
  newMessagQuill!: ElementRef;
  @ViewChild('newMessageDropdownAbove', { static: false, read: ElementRef })
  newMessageDropdownAbove!: ElementRef;

  constructor(
    public dialog: MatDialog,
    public storageService: StorageService,
    public channelService: ChannelService,
    public elementRef: ElementRef,
    private authService: AuthService,
    private messageService: MessageService,
    public quillService: QuillService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setSelectedChannelId();
    this.setSelectedUserId();
    this.subscription = this.storageService.uploadedFileURL.subscribe(
      (fileData) => {
        this.uploadedFiles.push(fileData);
      }
    );
  }

  openDetailViewFromUploadedImage(uploadedImageUrl: string) {
    this.dialog.open(DialogDetailViewUploadedDatasComponent, {
      data: {
        uploadedImageUrl: uploadedImageUrl,
      },
    });
  }

  onEditorFocus(editorType: 'top' | 'bottom') {
    if (editorType === 'top') {
      this.newMessageDropdownAbove.nativeElement.classList.add(
        'new-message-top'
      );
      this.newMessagQuill.nativeElement.classList.remove('new-message-bottom');

      if (window.innerHeight <= 500) {
        this.newMessageDropdownAbove.nativeElement.classList.add(
          'new-message-top-max-height'
        );
      }
    } else if (editorType === 'bottom' && window.innerHeight <= 500) {
      this.newMessagQuill.nativeElement.classList.add('new-message-bottom');
      this.newMessageDropdownAbove.nativeElement.classList.remove(
        'new-message-top'
      );
    }
  }

  setSelectedChannelId() {
    this.selectedChannelIdSubscription =
      this.quillService.selectedChannelIdSubject.subscribe((channelId) => {
        console.log('this channelid is:', channelId);

        if (channelId) {
          this.selectedChannelId = channelId;
          this.selectedUserId = null;
        }
      });
  }

  setSelectedUserId() {
    this.selectedUserIdSubscription =
      this.quillService.selectedUserIdSubject.subscribe((userId) => {
        console.log('The userId is:', userId);
        if (userId) {
          this.selectedUserId = userId;
          this.selectedChannelId = null;
        }
      });
  }

  async sendMessage() {
    const loggedInUser = this.authService.currentUserValue;
    const selectedItem = this.quillService.selectedItem;

    if (!selectedItem) {
      this.displayMessageContainerError();
      return;
    }

    if (this.isMessageEmpty()) {
      alert('Please enter a message or attach a file.');
      return;
    }

    this.processMessageContent(loggedInUser, selectedItem);
  }

  displayMessageContainerError() {
    this.messageContainerError = true;
    setTimeout(() => {
      this.messageContainerError = false;
    }, 3000);
  }

  isMessageEmpty() {
    return !this.messageContent && this.uploadedFiles.length === 0;
  }

  async processMessageContent(loggedInUser: any, selectedItem: any) {
    try {
      const messageContent = this.messageService.removePTags(
        this.messageContent
      );

      if (selectedItem.denotationChar === '#') {
        await this.sendChannelMessage(
          loggedInUser,
          selectedItem,
          messageContent
        );
        this.router.navigate(['/content/channel', selectedItem.id]);
      } else if (['@', '*'].includes(selectedItem.denotationChar)) {
        await this.sendDirectMessage(
          loggedInUser,
          selectedItem,
          messageContent
        );
        this.router.navigate(['/content/direct-message', selectedItem.id]);
      }

      this.clearMessageContent();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async sendChannelMessage(
    loggedInUser: any,
    selectedItem: any,
    messageContent: string
  ) {
    await this.messageService.createAndAddChannelMessage(
      selectedItem.id,
      loggedInUser!.uid,
      loggedInUser!.displayName as string,
      messageContent,
      this.uploadedFiles
    );
  }

  async sendDirectMessage(
    loggedInUser: any,
    selectedItem: any,
    messageContent: string
  ) {
    await this.messageService.createAndAddMessage(
      loggedInUser!.uid,
      selectedItem.id,
      loggedInUser!.displayName as string,
      messageContent,
      this.uploadedFiles
    );
  }

  clearMessageContent() {
    this.messageContent = '';
    this.uploadedFiles = [];
    this.storageService.clearUploadedFiles();
  }

  setFocus(event: any) {
    this.newMessageQuillInstance = event;
    this.quillService.setFocus(event);
  }

  toggleEmojiPicker() {
    const realEmojiButton = document.querySelector(
      '.textarea-emoji-control'
    ) as HTMLElement;
    if (realEmojiButton) {
      realEmojiButton.click();
    }
  }

  ngOnDestroy() {
    this.selectedChannelIdSubscription?.unsubscribe();
    this.selectedUserIdSubscription?.unsubscribe();
    this.quillService.cleanup();
    this.subscription.unsubscribe();
  }
}
