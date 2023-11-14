import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User } from 'src/app/shared/services/user';
import { MatDialog } from '@angular/material/dialog';
import { DialogProfileComponent } from '../dialog-profile/dialog-profile.component';
import { Channel } from 'src/app/models/channel';
import { MessageContent } from 'src/app/models/message';
import { MessageService } from 'src/app/shared/services/message.service';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { QuillService } from 'src/app/shared/services/quill.service';
import { Router } from '@angular/router';
import { ThreadService } from 'src/app/shared/services/thread.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @HostListener('document:click', ['$event'])
  screenWidth!: number;
  user: User | null = null;
  userSubscription!: Subscription;
  showMenu = false;
  isOnline?: boolean;
  user_images = 'assets/img/avatar1.svg';
  searchTerm: string = '';
  searchList?: boolean;
  searchSub?: Subscription;
  messagesSubscription?: Subscription;
  messages: MessageContent[] = [];
  filteredMessages: MessageContent[] = [];
  searchResults: {
    users?: User[];
    channels?: Channel[];
    directMessages?: MessageContent[];
    channelMessages?: MessageContent[];
  } = {};

  constructor(
    private authService: AuthService,
    private _eref: ElementRef,
    public dialog: MatDialog,
    public quillService: QuillService,
    public messageService: MessageService,
    public threadService: ThreadService
  ) {}

  ngOnInit() {
    this.userSubscriptionAndOnlineStatus();
    this.screenWidth = window.innerWidth;
  }


  userSubscriptionAndOnlineStatus() {
    this.userSubscription = this.authService.currentUser.subscribe((user) => {
      this.user = user;
      this.isOnline = user?.isOnline ?? undefined;
    });
  }


  @HostListener('window:resize', ['$event'])
  onResize() {
    this.screenWidth = window.innerWidth;
  }

  retryLoadImage(user: User | null) {
    if (user) {
      user.photoURL = this.user_images;
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogProfileComponent, {
      width: '600px',
      height: '700px',
      panelClass: 'custom-dialog-container',
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: { target: any }) {
    if (!this._eref.nativeElement.contains(event.target)) {
      this.showMenu = false;
    }
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  onLogout() {
    this.authService.signOut();
    this.showMenu = false;
  }


  navigateToSidenavMobile() {
    this.messageService.chatOpen = false;
    this.messageService.isSidenavOpen = true;
    this.messageService.headerChatMobile = false;
  }


  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }
}
