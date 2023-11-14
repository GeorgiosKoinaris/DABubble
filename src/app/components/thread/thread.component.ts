import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogDetailViewUploadedDatasComponent } from '../dialog-detail-view-uploaded-datas/dialog-detail-view-uploaded-datas.component';
import { ThreadService } from 'src/app/shared/services/thread.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/services/user';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/shared/services/message.service';
import { MessageContent } from 'src/app/models/message';
import { QuillService } from 'src/app/shared/services/quill.service';
import { Observable, Subject, Subscription, combineLatest, of, takeUntil } from 'rxjs';
import { QuillEditorComponent } from 'ngx-quill';


@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})


export class ThreadComponent implements OnInit, OnDestroy {
  isOnline?: boolean;
  messageContent: string = '';
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('threadQuill') threadQuill!: QuillEditorComponent;
  threadQuillInstance: any;
  private unsubscribe: Subject<void> = new Subject<void>();
  user_images = 'assets/img/avatar1.svg';
  selectedMessage: MessageContent | null = null;
  groupedMessages: { date: string; messages: MessageContent[] }[] = [];
  threadMessages: MessageContent[] = [];
  selectedUser: User | null = null;
  loggedInUser: User | null = null;
  channelId: string | null = null;
  uploadedFiles: { url: string; type: 'image' | 'data'; }[] = [];
  subscription!: Subscription;
  messageContainerError: boolean = false;
  currentUserId: string | null = null;


  constructor(
    public dialog: MatDialog,
    public threadService: ThreadService,
    private authService: AuthService,
    public route: ActivatedRoute,
    public messageService: MessageService,
    public router: Router,
    public quillService: QuillService) {

  }


  ngOnInit(): void {
    this.checkURL();
    this.handleStorageFiles();
    this.currentUserId = this.authService.currentUser.value?.uid || null;
  }


  handleStorageFiles() {
    this.subscription = this.threadService.uploadedFileURL.subscribe((fileData) => {
      this.uploadedFiles.push(fileData);
    });
  }


  checkURL() {
    combineLatest([
      this.loadLoggedInUser(),
      of(this.router.url)
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([loggedInUser, currentUrl]) => {
        this.loggedInUser = loggedInUser;
        const urlSegments = currentUrl.split('/');
        let messageId: string = urlSegments[5];

        if (urlSegments.includes('channel')) {
          this.handleChannel(urlSegments, messageId);
        } else if (urlSegments.includes('direct-message') && this.loggedInUser) {
          this.handleDirectMessage(messageId);
        }
      });
  }


  handleChannel(urlSegments: string[], messageId: string): void {
    this.channelId = urlSegments[3];
    this.messageService.getChannelMessageById(this.channelId, messageId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(message => {
        this.selectedMessage = message;
        this.fetchThreadMessages(messageId);
      });
  }


  handleDirectMessage(messageId: string): void {
    this.selectedUser = this.messageService.selectedUser;

    if (this.loggedInUser && this.selectedUser) {
      this.messageService.getDirectMessageById(this.loggedInUser.uid, this.selectedUser.uid, messageId)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(message => {
          this.selectedMessage = message;
          this.fetchThreadMessages(messageId);
        });
    }
  }


  loadLoggedInUser(): Observable<User | null> {
    return this.authService.user$.pipe(takeUntil(this.unsubscribe));
  }


  fetchThreadMessages(messageId: string): void {
    if (this.selectedMessage?.hasThread) {
      this.messageService.getThreadMessagesForMessageId(messageId)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((threadMessages: MessageContent[]) => {
          const groupedAndSortedMessages = this.messageService.groupMessagesByDate(threadMessages);
          this.groupedMessages = groupedAndSortedMessages;
        });
    }
  }


  async sendMessage() {
    if (!this.isValidMessage()) {
      this.messageContainerError = true;
      setTimeout(() => {
        this.messageContainerError = false;
      }, 3000);
      return;
    }

    if (this.loggedInUser) {
      const senderName = this.loggedInUser.displayName as string;

      const cleanedContent = this.messageService.removePTags(this.messageContent);

      try {
        await this.sendThreadMessage(senderName, cleanedContent);
        this.postMessageCleanup();
      } catch (error) {
        console.error("Couldn't send a message:", error);
      }
    }
  }


  isValidMessage(): boolean {
    if (
      (!this.messageContent && this.uploadedFiles.length === 0) ||
      !this.loggedInUser ||
      !this.selectedMessage?.id
    ) {
      console.error('Invalid message parameters.');
      return false;
    }
    return true;
  }


  async sendThreadMessage(senderName: string, cleanedContent: string) {
    const messageId = this.selectedMessage?.id;
    await this.messageService.createAndAddThreadMessage(
      this.loggedInUser!.uid,
      senderName,
      cleanedContent,
      messageId!,
      this.uploadedFiles
    )
    await this.updateHasThread(messageId!);
    this.threadService.clearUploadedFiles();
    this.uploadedFiles = []
  }


  async updateHasThread(messageId: string) {
    const urlSegments = this.router.url.split('/');
    if (urlSegments.includes('channel')) {
      await this.messageService.updateHasThreadForChannelMessage(this.channelId!, messageId, true);
    } else if (urlSegments.includes('direct-message') && this.selectedUser) {
      await this.messageService.updateHasThreadForDirectMessage(this.loggedInUser!.uid, this.selectedUser.uid, messageId, true);
    }
  }


  postMessageCleanup() {
    this.messageContent = '';
    this.scrollToBottom();
  }


  openDetailViewFromUploadedImage(uploadedImageUrl: string) {
    this.dialog.open(DialogDetailViewUploadedDatasComponent, {
      data: {
        uploadedImageUrl: uploadedImageUrl,
      }
    });
  }


  toggleEmojiPicker() {
    if (this.threadQuill && this.threadQuill.editorElem) {
      const realEmojiButton = this.threadQuill.editorElem.querySelector('.textarea-emoji-control') as HTMLElement;
      if (realEmojiButton) {
        realEmojiButton.click();
      }
    }
  }


  selectUser(user: User): void {
    this.messageContent = this.messageContent.replace(/@[^@]*$/, '@' + user.displayName + ' ');
  }


  private scrollToBottom(): void {
    this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
  }


  retryLoadImage(selectedMessage: MessageContent) {
    if (selectedMessage) {
      selectedMessage.senderImage = this.user_images;
    }
  }


  retryLoadThreadMessageSenderImage(threadMessage: MessageContent) {
    if (threadMessage) {
      threadMessage.senderImage = this.user_images;
    }
  }


  setFocus(event: any) {
    this.threadQuillInstance = event;
    this.quillService.setFocus(event)
  }


  get totalAnswers(): number {
    return this.groupedMessages.reduce((acc, group) => acc + group.messages.length, 0);
  }


  ngAfterViewInit() {
    this.checkWindowSize();
    window.addEventListener('resize', this.checkWindowSize.bind(this));
  }


  checkWindowSize() {
    if (this.threadQuill && this.threadQuill.editorElem) {
      if (window.innerHeight <= 500) {
        this.threadQuill.editorElem.classList.add('new-message-bottom');
      } else {
        this.threadQuill.editorElem.classList.remove('new-message-bottom');
      }
    }
  }


  openDetailViewForAttachedFile(fileUrl: string) {
    this.dialog.open(DialogDetailViewUploadedDatasComponent, {
      data: {
        uploadedImageUrl: fileUrl,
      },
    });
  }


  deleteFile(message: MessageContent, file: any, index: number) {
    const messageId = this.selectedMessage?.id;
    this.threadService.deleteFileFromStorage(file.url)
      .then(() => {
        if (message.attachedFiles && messageId && this.selectedUser?.uid) {
          message.attachedFiles.splice(index, 1);
          this.messageService.updateAttachedFilesInThreadMessage(this.loggedInUser!.uid, this.selectedUser.uid, messageId, message.attachedFiles);
        }
      })
      .catch(err => {
        console.error('Error deleting file from storage:', err);
      });
  }


  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.subscription.unsubscribe();
    window.removeEventListener('resize', this.checkWindowSize.bind(this));
  }
}