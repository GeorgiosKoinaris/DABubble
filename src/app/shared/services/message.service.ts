import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  collectionData,
  where,
  query,
  docData,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  deleteDoc,
} from '@angular/fire/firestore';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
} from 'rxjs';
import { MessageContent } from 'src/app/models/message';
import { AuthService } from './auth.service';
import { ChannelService } from 'src/app/shared/services/channel.service';
import { User } from 'src/app/shared/services/user';
import { Channel } from 'src/app/models/channel';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  selectedUser: User | null = null;
  loggedInUser: User | null = null;
  currentReceiverId: string | null = null;
  usersInChat: { [userId: string]: boolean } = {};
  private selectedMessageIdSubject = new BehaviorSubject<string | null>(null);
  selectedMessageId = this.selectedMessageIdSubject.asObservable();
  public shouldScrollToSpecificMessage: boolean = false;
  chatOpen: boolean = true;
  isSidenavOpen: boolean = true;
  isMobile!: boolean;
  headerChatMobile: boolean = false;
  resizeTimeout: any;
  lastScreenStatus: 'mobile' | 'desktop' =
    window.innerWidth <= 630 ? 'mobile' : 'desktop';

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    public channelService: ChannelService
  ) {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();
  }

  // Here begins the logic for all messages
  removePTags(htmlContent: string) {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;

    div.querySelectorAll('p').forEach((p) => {
      const text = p.innerText;
      const textNode = document.createTextNode(text);
      p.replaceWith(textNode);
    });

    return div.innerHTML;
  }

  getLoggedInUser(loggedInUserId: string): Observable<User | null> {
    return this.authService.getUserData(loggedInUserId);
  }

  groupMessagesByDate(
    messages: MessageContent[]
  ): { date: string; messages: MessageContent[] }[] {
    return messages.reduce<{ date: string; messages: MessageContent[] }[]>(
      (grouped, message) => {
        const dateStr = this.formatDate(message.timestamp);
        const foundGroup = grouped.find((group) => group.date === dateStr);
        if (foundGroup) {
          foundGroup.messages.push(message);
        } else {
          grouped.push({ date: dateStr, messages: [message] });
        }
        return grouped;
      },
      []
    );
  }

  formatDate(timestamp: number): string {
    const date = this.stripTime(new Date(timestamp));
    const today = this.stripTime(new Date());
    const yesterday = this.stripTime(new Date(Date.now() - 86400000)); // 24 * 60 * 60 * 1000

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    };
    return date.toLocaleDateString('en-US', options);
  }

  stripTime(date: Date): Date {
    date.setHours(0, 0, 0, 0);
    return date;
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleTimeString('de-DE', options);
  }
  // Here ends the logic for all messages

  // Here begins the logic for the direct-messages
  async createAndAddMessage(
    senderId: string,
    receiverId: string,
    senderName: string,
    content: string,
    uploadedFiles?: { url: string; type: 'image' | 'data' }[]
  ): Promise<void> {
    const loggedInUser = this.authService.currentUserValue;
    const message = new MessageContent({
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      contentLowerCase: content.toLowerCase(),
      timestamp: Date.now(),
      senderName: senderName,
      senderImage: loggedInUser?.photoURL ?? '',
      hasThread: false,
      channelId: null,
      attachedFiles: uploadedFiles,
    });

    const messageCollection = this.getDirectMessageCollection(
      senderId,
      receiverId
    );
    try {
      await addDoc(messageCollection, message.toJSON());

      if (senderId !== receiverId) {
        const receiverRef = doc(this.firestore, 'users', receiverId);
        await updateDoc(receiverRef, {
          hasUnreadMessages: arrayUnion(senderId),
        });
      }
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  }

  getDirectMessageCollection(userId1: string, userId2: string) {
    const chatId = this.generateChatId(userId1, userId2);
    return collection(
      doc(this.firestore, `directMessage/${chatId}`),
      'messages'
    );
  }

  generateChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  getDirectMessages(
    userId1: string,
    userId2: string
  ): Observable<MessageContent[]> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    return collectionData(messageCollection, { idField: 'id' }).pipe(
      map((docs) => docs.map((doc) => new MessageContent(doc)))
    );
  }

  getDirectMessageById(
    userId1: string,
    userId2: string,
    messageId: string
  ): Observable<MessageContent | null> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    const messageRef = doc(messageCollection, messageId);

    return docData(messageRef, { idField: 'id' }).pipe(
      map((data) => {
        if (data) {
          return new MessageContent({ ...data });
        } else {
          return null;
        }
      })
    );
  }

  async updateDirectMessage(
    userId1: string,
    userId2: string,
    messageId: string,
    updatedContent: string
  ): Promise<void> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    const messageRef = doc(messageCollection, messageId);

    try {
      await updateDoc(messageRef, {
        content: updatedContent,
        timestamp: Date.now(),
      });
      const receiverRef = doc(this.firestore, 'users', userId2);
      await updateDoc(receiverRef, { hasUnreadMessages: arrayUnion(userId1) });
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }

  hasUnreadMessages(
    userId1: string,
    userId2: string,
    currentUser: string
  ): Observable<boolean> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    return collectionData(messageCollection, { idField: 'id' }).pipe(
      map((messages) =>
        messages.some(
          (message) => !message['read'] && message['receiverId'] === currentUser
        )
      )
    );
  }

  async setEmoji(
    userId1: string,
    userId2: string,
    messageId: string,
    emojiType: string
  ): Promise<void> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    const messageRef = doc(messageCollection, messageId);

    try {
      const messageDoc = await getDoc(messageRef);
      if (messageDoc.exists()) {
        const currentEmojis = messageDoc.data()
          ? messageDoc.data()['emojis'] || {}
          : {};
        const currentCount = currentEmojis[emojiType] || 0;
        await updateDoc(messageRef, {
          [`emojis.${emojiType}`]: currentCount + 1,
        });
      }
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }

  async markMessagesAsRead(senderId: string, receiverId: string) {
    const receiverRef = doc(this.firestore, 'users', receiverId);
    await updateDoc(receiverRef, { hasUnreadMessages: arrayRemove(senderId) });
  }

  selectReceiver(userId: string) {
    this.currentReceiverId = userId;
  }

  markAsReadIfCurrentReceiver(senderId: string) {
    if (this.currentReceiverId === senderId) {
    }
  }

  async updateAttachedFilesInDirectMessage(
    userId1: string,
    userId2: string,
    messageId: string,
    updatedFiles: { url: string; type: 'image' | 'data' }[]
  ) {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    const messageRef = doc(messageCollection, messageId);

    try {
      await updateDoc(messageRef, {
        attachedFiles: updatedFiles,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }


  async deleteDirectMessage(userId1: string, userId2: string, messageId: string): Promise<void> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    const messageRef = doc(messageCollection, messageId);

    try {
      await deleteDoc(messageRef);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  // Here ends the logic for the direct-messages

  // Here begins the logic for channel-messages
  async createAndAddChannelMessage(
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
    uploadedFiles?: { url: string; type: 'image' | 'data' }[]
  ) {
    const loggedInUser = this.authService.currentUserValue;
    const message = new MessageContent({
      senderId: senderId,
      content: content,
      contentLowerCase: content.toLowerCase(),
      timestamp: Date.now(),
      read: false,
      senderName: senderName,
      senderImage: loggedInUser?.photoURL ?? '',
      hasThread: false,
      channelId: channelId,
      attachedFiles: uploadedFiles,
    });

    const messageCollection = collection(
      this.firestore,
      'channels',
      channelId,
      'messages'
    );
    try {
      const docRef = await addDoc(messageCollection, message.toJSON());
      const generatedId = docRef.id;
      message.id = generatedId;
      const channelRef = doc(this.firestore, 'channels', channelId);
      const channelSnap = await getDoc(channelRef);

      if (channelSnap.exists()) {
        await updateDoc(channelRef, { readBy: [senderId] });
      }
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  }

  getChannelMessageCollection(channelID: string) {
    return collection(this.firestore, 'channels', channelID, 'messages');
  }

  getChannelMessages(channelID: string): Observable<MessageContent[]> {
    const messageCollection = this.getChannelMessageCollection(channelID);
    return collectionData(messageCollection, { idField: 'id' }).pipe(
      map((docs) => docs.map((doc) => new MessageContent(doc))),
      catchError((error) => {
        console.error(
          `Fehler beim Abrufen der Nachrichten für den Kanal ${channelID}:`,
          error
        );
        return of([]);
      })
    );
  }

  getChannelMessageById(
    channelID: string,
    messageId: string
  ): Observable<MessageContent | null> {
    const messageRef = doc(
      this.getChannelMessageCollection(channelID),
      messageId
    );
    return docData(messageRef, { idField: 'id' }).pipe(
      map((data) => {
        if (data) {
          return new MessageContent({ ...data });
        } else {
          return null;
        }
      })
    );
  }

  getChannels(): Observable<Channel[]> {
    const collectionInstance = query(
      collection(this.firestore, 'channels'),
      orderBy('channelName')
    );

    return collectionData(collectionInstance, {
      idField: 'id',
    }).pipe(map((docs: any[]) => docs.map((doc) => new Channel(doc))));
  }

  fetchAllChannelMessages(): Observable<MessageContent[]> {
    return this.getChannels().pipe(
      switchMap((channels) => {
        const messageObservables = channels.map((channel) => {
          const messagesRef = collection(
            this.firestore,
            `channels/${channel.channelId}/messages`
          );
          return collectionData(messagesRef, { idField: 'id' }).pipe(
            catchError((error) => {
              console.error(
                'Fehler beim Laden der Nachrichten für Channel:',
                channel.channelId,
                error
              );
              return of([]);
            }),
            map((docs) => docs.map((doc) => new MessageContent(doc)))
          );
        });
        return combineLatest(messageObservables).pipe(
          map((messageArrays: MessageContent[][]) => {
            return messageArrays.reduce((acc, curr) => acc.concat(curr), []);
          })
        );
      })
    );
  }

  async updateChannelMessage(
    channelID: string,
    messageId: string,
    updatedContent: string
  ) {
    const messageRef = doc(
      this.getChannelMessageCollection(channelID),
      messageId
    );

    try {
      await updateDoc(messageRef, {
        content: updatedContent,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }

  async setChannelMessageEmoji(
    channelID: string,
    messageId: string,
    emojiType: string
  ): Promise<void> {
    const messageCollection = this.getChannelMessageCollection(channelID);
    const messageRef = doc(messageCollection, messageId);

    try {
      const messageDoc = await getDoc(messageRef);
      if (messageDoc.exists()) {
        const currentEmojis = messageDoc.data()
          ? messageDoc.data()['emojis'] || {}
          : {};
        const currentCount = currentEmojis[emojiType] || 0;
        await updateDoc(messageRef, {
          [`emojis.${emojiType}`]: currentCount + 1,
        });
      }
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }

  markChannelMessageAsRead(channelId: string) {
    const userId = this.authService.currentUserValue?.uid;
    if (userId) {
      const channelRef = doc(this.firestore, 'channels', channelId);
      updateDoc(channelRef, {
        readBy: arrayUnion(userId),
      }).catch((error) => console.error('Error updating document: ', error));
    }
  }

  setSelectedMessageId(id: string) {
    this.selectedMessageIdSubject.next(id);
  }

  async updateAttachedFilesInChannelMessage(
    channelID: string,
    messageId: string,
    updatedFiles: { url: string; type: 'image' | 'data' }[]
  ) {
    const messageRef = doc(
      this.getChannelMessageCollection(channelID),
      messageId
    );

    try {
      await updateDoc(messageRef, {
        attachedFiles: updatedFiles,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  }


  async deleteChannelMessage(channelID: string, messageId: string): Promise<void> {
    const messageRef = doc(this.getChannelMessageCollection(channelID), messageId);

    try {
      await deleteDoc(messageRef);
    } catch (err) {
      console.error('Error deleting channel message: ', err);
      throw err;
    }
  }


  // Here ends the logic for channel-messages

  // Here begins the logic for the thread-messages
  async createAndAddThreadMessage(
    senderId: string,
    senderName: string,
    content: string,
    messageId: string,
    uploadedFiles?: { url: string; type: 'image' | 'data' }[]

  ): Promise<string | null> {
    const loggedInUser = this.authService.currentUserValue;
    const message = new MessageContent({
      senderId: senderId,
      content: content,
      timestamp: Date.now(),
      contentLowerCase: content.toLowerCase(),
      senderName: senderName,
      senderImage: loggedInUser?.photoURL ?? '',
      hasThread: true,
      messageId: messageId,
      channelId: null,
      attachedFiles: uploadedFiles,
    });
    const messageCollection = collection(this.firestore, 'thread-messages');
    try {
      const docRef = await addDoc(messageCollection, message.toJSON());
      return docRef.id;
    } catch (error) {
      console.error('Error adding document: ', error);
      return null;
    }
  }

  getThreadMessagesForMessageId(
    messageId: string
  ): Observable<MessageContent[]> {
    const threadMessageCollection = collection(
      this.firestore,
      'thread-messages'
    );
    const threadQuery = query(
      threadMessageCollection,
      where('messageId', '==', messageId)
    );

    return collectionData(threadQuery, { idField: 'id' }).pipe(
      map((docs) => docs.map((doc) => new MessageContent(doc)))
    );
  }

  updateHasThreadForChannelMessage(
    channelId: string,
    messageId: string,
    hasThread: boolean
  ): Promise<void> {
    const messageDocRef = doc(
      this.firestore,
      'channels',
      channelId,
      'messages',
      messageId
    );
    return updateDoc(messageDocRef, { hasThread: hasThread });
  }

  async updateHasThreadForDirectMessage(
    userId1: string,
    userId2: string,
    messageId: string,
    hasThread: boolean
  ): Promise<void> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    const messageRef = doc(messageCollection, messageId);

    try {
      await updateDoc(messageRef, {
        hasThread: hasThread,
      });
    } catch (error) {
      console.error('Error updating document:', error);
    }
  }
  // Here ends the logic for the thread-messages

  handleResize() {
    this.isMobile = window.innerWidth <= 630;

    if (window.innerWidth <= 630) {
      this.chatOpen = false;
      this.lastScreenStatus = 'mobile';
      this.isSidenavOpen = true;
    } else if (window.innerWidth > 630) {
      this.chatOpen = true;
      this.headerChatMobile = false;
      this.lastScreenStatus = 'desktop';
    }
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  openChatMobile() {
    if (this.isMobile) {
      this.chatOpen = true;
      this.isSidenavOpen = false;
      this.headerChatMobile = true;
    }
  }


  async updateAttachedFilesInThreadMessage(
    userId1: string,
    userId2: string,
    messageId: string,
    updatedFiles: { url: string; type: 'image' | 'data' }[]
  ): Promise<void> {
    const messageCollection = this.getDirectMessageCollection(userId1, userId2);
    const messageRef = doc(messageCollection, messageId);

    try {
      await updateDoc(messageRef, {
        attachedFiles: updatedFiles,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
    }
  }

}
