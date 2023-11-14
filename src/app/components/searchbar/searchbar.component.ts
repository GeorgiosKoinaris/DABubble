import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { Channel } from 'src/app/models/channel';
import { MessageContent } from 'src/app/models/message';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { MessageService } from 'src/app/shared/services/message.service';
import { User } from 'src/app/shared/services/user';

@Component({
  selector: 'app-searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.scss'],
})
export class SearchbarComponent implements OnDestroy {
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
    private messageService: MessageService,
    private channelService: ChannelService,
    private router: Router
  ) {}

  retryLoadImage(user: User | null) {
    if (user) {
      user.photoURL = this.user_images;
    }
  }

  onSearchChange(term: string): void {
    this.searchList = term.length > 0;
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
    this.searchSub = combineLatest([
      this.authService.getUsers(term),
      this.channelService.getChannels(term),
      this.filterMessages(term),
    ]).subscribe(([users, channels, channelMessages]) => {
      this.searchResults.users = users;
      this.searchResults.channels = channels;
      this.searchResults.channelMessages = channelMessages;
    });
  }

  filterMessages(term: string): Observable<MessageContent[]> {
    return new Observable((observer) => {
      if (term) {
        const filtered = this.messages.filter((message) =>
          message.contentLowerCase.includes(term.toLowerCase())
        );
        observer.next(filtered);
        observer.complete();
      } else {
        observer.next([...this.messages]);
        observer.complete();
      }
    });
  }

  navigateToChannel(channelId: string): void {
    this.searchList = false;
    this.searchTerm = '';
    this.router.navigate(['/content/channel', channelId]);
    this.messageService.openChatMobile();
  }

  navigateToDirectMessage(uid: string) {
    this.searchList = false;
    this.searchTerm = '';
    this.router.navigate(['/content/direct-message', uid]);
    this.messageService.openChatMobile();
  }

  loadAllMessages(): void {
    this.messagesSubscription?.unsubscribe();
    this.messageService.fetchAllChannelMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Nachrichten:', error);
      },
    });
  }

  navigateToChannelMessage(channelId: string, messageId: string): void {
    this.searchList = false;
    this.searchTerm = '';
    this.messageService.setSelectedMessageId(messageId);
    this.messageService.shouldScrollToSpecificMessage = true;
    this.router.navigate(['/content/channel', channelId]);
    this.messageService.openChatMobile();
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
  }
}
