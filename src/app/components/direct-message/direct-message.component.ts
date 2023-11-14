import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/services/user';
import {
  Observable,
  Subject,
  Subscription,
  combineLatest,
  filter,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'src/app/shared/services/message.service';
import { MessageContent } from 'src/app/models/message';
import { DialogDirectMessageProfileComponent } from '../dialog-direct-message-profile/dialog-direct-message-profile.component';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from 'src/app/shared/services/storage.service';
import { ThreadService } from 'src/app/shared/services/thread.service';
import { DialogDetailViewUploadedDatasComponent } from '../dialog-detail-view-uploaded-datas/dialog-detail-view-uploaded-datas.component';
import { QuillService } from 'src/app/shared/services/quill.service';

@Component({
  selector: 'app-direct-message',
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss'],
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  isOnline?: boolean;
  messageContent: string = '';
  messages: MessageContent[] = [];
  groupedMessages: { date: string; messages: MessageContent[] }[] = [];
  ngUnsubscribe = new Subject<void>();
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('directMessageQuill', { static: false, read: ElementRef }) directMessageQuill!: ElementRef;
  directMessageQuillInstance: any;
  user_images = 'assets/img/avatar1.svg';
  popUpToEditMessageIsOpen: boolean = false;
  showEditMessageButton: boolean = false;
  currentlyEditingMessageId: string | null = null;
  isEditing: string | null = null;
  updatedMessageContent: string = '';
  messagesSubscription: Subscription | null = null;
  selectedMessageId: string | null = null;
  showEditMenu: boolean = true;
  uploadedFiles: { url: string; type: 'image' | 'data'; }[] = [];
  subscription!: Subscription;
  messageContainerError: boolean = false;
  messageId: string | null = null;
  currentUserId: string | null = null;
  messageContentEmpty: boolean = false;


  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    public messageService: MessageService,
    public dialog: MatDialog,
    public storageService: StorageService,
    public threadService: ThreadService,
    public quillService: QuillService
  ) { }

  ngOnInit() {
    this.initUsers();
    this.handleStorageFiles();
    this.currentUserId = this.authService.currentUser.value?.uid || null;
  }

  initUsers() {
    this.loadChatParticipants().subscribe(([selectedUser, loggedInUser]) => {
      this.messageService.selectedUser = selectedUser;
      this.messageService.loggedInUser = loggedInUser;

      if (loggedInUser && selectedUser) {
        this.messageService.usersInChat[loggedInUser.uid] = true;
        this.loadDirectMessages(loggedInUser.uid, selectedUser.uid);
      } else {
        console.error('Either loggedInUser or selectedUser is null');
      }
    });
  }


  handleStorageFiles() {
    this.subscription = this.storageService.uploadedFileURL.subscribe((fileData) => {
      this.uploadedFiles.push(fileData);
    });
  }


  loadChatParticipants(): Observable<[User | null, User | null]> {
    return combineLatest([
      this.route.paramMap.pipe(map((params) => params.get('id'))),
      this.authService.user$,
    ]).pipe(
      filter(([uid, user]) => !!uid && !!user),
      switchMap(([uid, loggedInUser]) => {
        const selectedUser$ = this.authService.getUserData(uid as string);
        return combineLatest([selectedUser$, of(loggedInUser)]);
      }),
      takeUntil(this.ngUnsubscribe)
    );
  }

  loadDirectMessages(userId1: string, userId2: string) {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    this.messagesSubscription = this.messageService
      .getDirectMessages(userId1, userId2)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((messages) => {
        if (
          this.messageService.loggedInUser &&
          this.messageService.selectedUser
        ) {
          if (
            this.messageService.loggedInUser.uid !==
            this.messageService.selectedUser.uid
          ) {
            this.messageService.markMessagesAsRead(
              this.messageService.selectedUser.uid,
              this.messageService.loggedInUser.uid
            );
          }
        }
        messages.sort((a, b) => a.timestamp - b.timestamp);
        this.messages = messages;
        this.groupedMessages = this.messageService.groupMessagesByDate(
          this.messages
        );
        setTimeout(() => {
          this.scrollToBottom();
        }, 500);
      });
  }

  handleReceivedMessages(messages: MessageContent[]) {
    const { loggedInUser, selectedUser } = this.messageService;

    loggedInUser &&
      selectedUser &&
      this.messageService.markMessagesAsRead(
        selectedUser.uid,
        loggedInUser.uid
      );

    this.messages = messages.sort((a, b) => a.timestamp - b.timestamp);
    this.groupedMessages = this.messageService.groupMessagesByDate(
      this.messages
    );

    setTimeout(() => this.scrollToBottom(), 500);
  }

  sendMessage() {
    if (!this.messageContent && this.uploadedFiles.length === 0) {
      this.messageContainerError = true;
      setTimeout(() => {
        this.messageContainerError = false;
      }, 3000);
      return;
    }

    const senderName = this.messageService.loggedInUser!.displayName as string;
    const cleanedContent = this.messageService.removePTags(
      this.messageContent
    );
    this.messageService
      .createAndAddMessage(
        this.messageService.loggedInUser!.uid,
        this.messageService.selectedUser!.uid,
        senderName,
        cleanedContent,
        this.uploadedFiles
      )
      .then(() => {
        this.messageContent = '';
        this.scrollToBottom();
        this.uploadedFiles = [];
        this.storageService.clearUploadedFiles()
      })
      .catch((error: any) => {
        console.error("Couldn't send a message:", error);
      });

  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogDirectMessageProfileComponent, {
      width: '600px',
      height: '700px',
      panelClass: 'custom-dialog-container',
      data: { selectedUser: this.messageService.selectedUser },
    });
  }

  toggleEmojiPicker() {
    const realEmojiButton = document.querySelector(
      '.textarea-emoji-control'
    ) as HTMLElement;
    if (realEmojiButton) {
      realEmojiButton.click();
    }
  }

  selectUser(user: User): void {
    this.messageContent = this.messageContent.replace(
      /@[^@]*$/,
      '@' + user.displayName + ' '
    );
  }

  chooseFiletoUpload($event: any) {
    this.storageService.chooseFileSevice($event);
  }

  openDetailViewFromUploadedImage(uploadedImageUrl: string) {
    this.dialog.open(DialogDetailViewUploadedDatasComponent, {
      data: {
        uploadedImageUrl: uploadedImageUrl,
      },
    });
  }

  scrollToBottom(): void {
    this.messagesContainer.nativeElement.scrollTop =
      this.messagesContainer.nativeElement.scrollHeight;
  }

  onEmojiClick(messageId: string, emojiType: string): void {
    const loggedInUserId = this.messageService.loggedInUser?.uid as string;
    const receiverUserId = this.messageService.selectedUser?.uid as string;
    this.messageService.setEmoji(
      loggedInUserId,
      receiverUserId,
      messageId,
      emojiType
    );
  }

  openEmojiPopUp(messageId: string) {
    this.selectedMessageId =
      this.selectedMessageId === messageId ? null : messageId;
  }

  openPopUpEditMessage(message: MessageContent) {
    if (
      this.messageService.loggedInUser?.uid === message.senderId &&
      message.id
    ) {
      this.currentlyEditingMessageId =
        this.currentlyEditingMessageId === message.id ? null : message.id;
    }
  }

  onMessageHover(message: MessageContent) {
    this.showEditMessageButton =
      this.messageService.loggedInUser?.uid === message.senderId;
  }

  closeEditMenu() {
    this.currentlyEditingMessageId = null;
  }

  handleMouseLeave(messageId: string): void {
    if (this.selectedMessageId === messageId) {
      this.selectedMessageId = null;
    }

    if (this.isEditing) {
      return;
    } else if (!this.isMessageBeingEdited(messageId)) {
      this.showEditMessageButton = false;
      this.closeEditMenu();
    }
  }

  isMessageBeingEdited(messageId: string): boolean {
    return this.isEditing === messageId;
  }

  stopEvent(event: Event) {
    event.stopPropagation();
  }

  saveEditedMessage(message: MessageContent) {
    const messageId = message.id;
    const updatedMessageContent = this.updatedMessageContent;
    const loggedInUserId = this.messageService.loggedInUser?.uid as string;
    const receiverUserId = this.messageService.selectedUser?.uid as string;

    if (
      messageId &&
      this.updatedMessageContent &&
      this.updatedMessageContent !== message.content
    ) {
      this.messageService.updateDirectMessage(
        loggedInUserId,
        receiverUserId,
        messageId,
        updatedMessageContent
      );
    }
    this.isEditing = null;
    this.showEditMenu = true;
  }

  editMessage(messageId: string, currentContent: string) {
    this.isEditing = messageId;
    this.updatedMessageContent = currentContent;
    this.showEditMenu = false;
  }

  retryLoadImage(user: User | null) {
    if (user) {
      user.photoURL = this.user_images;
    }
  }

  retryLoadSenderImage(message: MessageContent) {
    message.senderImage = this.user_images;
  }


  setFocus(event: any) {
    this.directMessageQuillInstance = event;
    this.quillService.setFocus(event)
  }


  openDetailViewForAttachedFile(fileUrl: string) {
    this.dialog.open(DialogDetailViewUploadedDatasComponent, {
      data: {
        uploadedImageUrl: fileUrl,
      },
    });
  }


  deleteFile(message: MessageContent, file: any, index: number) {
    const messageId = message.id;
    const loggedInUserId = this.messageService.loggedInUser?.uid as string;
    const receiverUserId = this.messageService.selectedUser?.uid as string;
    this.storageService.deleteFileFromStorage(file.url)
      .then(() => {
        if (message.attachedFiles && messageId && loggedInUserId && receiverUserId) {
          message.attachedFiles.splice(index, 1);
          this.messageService.updateAttachedFilesInDirectMessage(loggedInUserId, receiverUserId, messageId, message.attachedFiles);
          this.messageService.deleteDirectMessage(loggedInUserId, receiverUserId, messageId);
        }
      })
      .catch(err => {
        console.error('Error deleting file from storage:', err);
      });
  }


  runDeleteDirectMessage(messageId: string) {    
    const loggedInUserId = this.messageService.loggedInUser?.uid as string;
    const receiverUserId = this.messageService.selectedUser?.uid as string;
    if (loggedInUserId && receiverUserId && messageId) {
      console.log('Try to delete direct-message', loggedInUserId, receiverUserId, messageId);
      this.messageService.deleteDirectMessage(loggedInUserId, receiverUserId, messageId)
        .then(() => {
          console.log('reset edit menu');          
          this.isEditing = null;
          this.showEditMenu = true;
        })
        .catch(error => {
          console.error('Error while deleting message:', error);
        });
    }
  }


  ngAfterViewInit() {
    this.checkWindowSize();
    window.addEventListener('resize', this.checkWindowSize.bind(this));
  }


  checkWindowSize() {
    if (window.innerHeight <= 500) {
      this.directMessageQuill.nativeElement.classList.add('new-message-bottom');
    } else {
      this.directMessageQuill.nativeElement.classList.remove('new-message-bottom');
    }
  }


  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.messagesSubscription?.unsubscribe();
    this.quillService.cleanup();
    this.subscription.unsubscribe();
    window.removeEventListener('resize', this.checkWindowSize.bind(this));
  }
}