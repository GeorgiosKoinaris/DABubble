import { Timestamp } from '@angular/fire/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  displayNameLower?: string | null;
  emailVerified: boolean;
  isOnline?: boolean;
  hasUnreadMessages?: string[];
  photoURL: string | null | undefined;
  lastActive?: Timestamp;
}
