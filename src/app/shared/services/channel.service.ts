import { Injectable } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  query,
  deleteDoc,
  onSnapshot,
  where,
  getDocs,
  DocumentData,
  Query,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Channel } from 'src/app/models/channel';
import { User } from './user';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  channelData!: Observable<any>;
  channel: any = new Channel();

  constructor(private firestore: Firestore, public route: Router) {}

  addChannelService(channel: Channel) {
    const collectionInstance = collection(this.firestore, 'channels');
    const channelData = channel.toJSON();
    if (channelData.users) {
      for (let user of channelData.users) {
        if (!user.hasUnreadMessages) {
          user.hasUnreadMessages = [];
        }
      }
    }

    addDoc(collectionInstance, channel.toJSON()).then((docRef) => {
      const channelId = docRef.id;
      const updatedData = { channelId };

      const docInstance = doc(this.firestore, 'channels', channelId);

      updateDoc(docInstance, updatedData);
    });
  }

  getChannelService() {
    const collectionInstance = query(
      collection(this.firestore, 'channels'),
      orderBy('channelName')
    );
    this.channelData = collectionData(collectionInstance, {
      idField: 'id',
    }).pipe();
  }

  updateChannelNameService(changedChannelName: any, channelId: string) {
    const docInstance = doc(this.firestore, 'channels', channelId);
    const updateData = {
      channelName: changedChannelName,
    };
    updateDoc(docInstance, updateData);
    onSnapshot(docInstance, (doc) => {
      this.channel = doc.data();
    });
  }

  updateChannelDescriptionService(
    changedChannelDescription: string,
    channelId: string
  ) {
    const docInstance = doc(this.firestore, 'channels', channelId);
    const updateData = {
      channelDescription: changedChannelDescription,
    };
    updateDoc(docInstance, updateData);
    onSnapshot(docInstance, (doc) => {
      this.channel = doc.data();
    });
  }

  updateChannelMembersService(channelId: string, selectedUsers: User[]) {
    const docInstance = doc(this.firestore, 'channels', channelId);

    const cleanedSelectedUsers = selectedUsers.map((user) =>
      this.removeUndefinedFields(user)
    );

    const updateData = [...this.channel.users, ...cleanedSelectedUsers];
    console.log('Selecetd User is:', cleanedSelectedUsers);

    return updateDoc(docInstance, {
      users: updateData,
    });
  }

  removeUndefinedFields(obj: any): any {
    const cleaned = { ...obj };
    for (const key in cleaned) {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    }
    return cleaned;
  }

  deleteChannelService(channelId: string) {
    const docInstance = doc(this.firestore, 'channels', channelId);
    deleteDoc(docInstance).then(() => {
      console.log('Document deleted');
    });
    this.navigateToOthersChannelAsSoonAsDeleteService();
  }

  navigateToOthersChannelAsSoonAsDeleteService() {
    const querie = query(
      collection(this.firestore, 'channels'),
      orderBy('channelName')
    );
    getDocs(querie).then((querySnapshot) => {
      if (querySnapshot.empty) {
        this.route.navigate(['/content']);
      } else {
        this.route.navigate(['/content/channel/', querySnapshot.docs[0].id]);
      }
    });
  }

  getSingleChannelService(channelId: string) {
    const collectionInstance = collection(this.firestore, 'channels');
    const docRef = doc(collectionInstance, channelId);
    getDoc(docRef).then((doc) => {
      this.channel = doc.data();
    });
  }

  getChannels(searchTerm?: string): Observable<Channel[]> {
    let channelQuery;
    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      channelQuery = query(
        collection(this.firestore, 'channels'),
        where('channelName', '>=', lowerCaseTerm),
        where('channelName', '<=', lowerCaseTerm + '\uf8ff')
      );
    } else {
      channelQuery = collection(this.firestore, 'channels');
    }
    return collectionData(channelQuery, { idField: 'channelId' }) as Observable<
      Channel[]
    >;
  }

  mapFirestoreDataToChannels(
    channelQuery: Query<DocumentData>
  ): Observable<Channel[]> {
    return collectionData(channelQuery).pipe(
      map((channelsData) =>
        channelsData.map(
          (data) =>
            ({
              channelName: data['channelName'],
            } as Channel)
        )
      )
    );
  }
}
