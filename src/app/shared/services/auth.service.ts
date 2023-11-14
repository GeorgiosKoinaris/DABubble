import { Injectable } from '@angular/core';
import { User } from '../services/user';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  map,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { StorageService } from 'src/app/shared/services/storage.service';
import {
  Firestore,
  doc,
  setDoc,
  docData,
  updateDoc,
  collection,
  collectionData,
  deleteDoc,
  query,
  where,
  Timestamp,
  Query,
  DocumentData,
} from '@angular/fire/firestore';
import {
  Auth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  onAuthStateChanged,
  getAuth,
  updateEmail,
  confirmPasswordReset,
} from '@angular/fire/auth';
import { browserLocalPersistence } from 'firebase/auth';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public user$: Observable<User | null>;
  private userSubscription?: Subscription;
  currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(
    null
  );

  constructor(
    public auth: Auth,
    public router: Router,
    public storageService: StorageService,
    private firestore: Firestore
  ) {
    this.user$ = new Observable<User | null>((subscriber) => {
      return onAuthStateChanged(this.auth, subscriber);
    }).pipe(shareReplay(1));
    this.initCurrentUser();
    this.setPersistence();
  }

  user_images: string[] = [
    'assets/img/avatar1.svg',
    'assets/img/avatar2.svg',
    'assets/img/avatar3.svg',
    'assets/img/avatar4.svg',
    'assets/img/avatar5.svg',
    'assets/img/avatar6.svg',
  ];

  async setPersistence() {
    try {
      await this.auth.setPersistence(browserLocalPersistence);
    } catch (error) {
      console.error("Couldn't set persistence", error);
    }
  }

  getRandomGuestImage(): string {
    const randomIndex = Math.floor(Math.random() * this.user_images.length);
    return this.user_images[randomIndex];
  }

  initCurrentUser(): void {
    this.user$
      .pipe(
        switchMap((firebaseUser) =>
          firebaseUser?.uid ? this.getUserData(firebaseUser.uid) : of(null)
        )
      )
      .subscribe((user) => {
        this.currentUser.next(user);
      });
  }

  get currentUserValue(): User | null {
    return this.currentUser.value;
  }

  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      if (userCredential.user) {
        await this.setUserOnlineStatus(userCredential.user.uid, true);
        const lastRoute =
          localStorage.getItem('lastRoute') ||
          'content/channel/DMoH03MTsuxcytK6BpUb';
        this.router.navigate([lastRoute]);
        console.log(lastRoute);
      }
    } catch (error) {
      console.log('An unexpected error occurred. Please try again', error);
      throw error;
    }
  }

  async signUp(
    displayName: string,
    email: string,
    password: string,
    selectedAvatarURL: string
  ) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName,
          photoURL: selectedAvatarURL,
        });
        await this.setUserData(userCredential.user, true);
        this.router.navigate(['content/channel/DMoH03MTsuxcytK6BpUb']);
      }
    } catch (error) {
      console.log('An unexpected error occurred. Please try again.', error);
      throw error;
    }
  }

  async signInAnonymously() {
    try {
      const userCredential = await signInAnonymously(this.auth);
      const randomImageURL = this.getRandomGuestImage();
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: 'Guest',
          photoURL: randomImageURL,
        });
        await this.setUserData(userCredential.user, true);
        const lastRoute =
          localStorage.getItem('lastRoute') ||
          'content/channel/DMoH03MTsuxcytK6BpUb';
        this.router.navigate([lastRoute]);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      if (user) {
        await this.setUserData(user, true);
        const lastRoute =
          localStorage.getItem('lastRoute') ||
          'content/channel/DMoH03MTsuxcytK6BpUb';
        this.router.navigate([lastRoute]);
      }
    } catch (error) {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  }

  async forgotPassword(passwordResetEmail: string) {
    try {
      await sendPasswordResetEmail(this.auth, passwordResetEmail);
    } catch (error) {
      console.log('An unexpected error occurred. Please try again', error);
      throw error;
    }
  }

  async signOut() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      if (currentUser.displayName === 'Guest') {
        await this.deleteGuestUser(currentUser.uid);
      } else {
        await this.setUserOnlineStatus(currentUser.uid, false);
      }
    }
    await signOut(this.auth);
    this.router.navigate(['login']);
  }

  async deleteGuestUser(uid: string) {
    try {
      if (this.auth.currentUser && this.auth.currentUser.uid === uid) {
        await deleteUser(this.auth.currentUser);
      }
      await deleteDoc(doc(this.firestore, 'users', uid));
      this.userSubscription?.unsubscribe();
    } catch (error) {
      console.error('Error during deleting guest user:', error);
    }
  }

  async setUserData(user: FirebaseUser, isOnline?: boolean) {
    const { uid, email, displayName, emailVerified, photoURL } = user;
    const userData: User = {
      uid,
      email: email || null,
      displayName: displayName || null,
      displayNameLower: displayName?.toLowerCase() || null,
      emailVerified,
      photoURL,
      lastActive: Timestamp.now(),
      ...(typeof isOnline !== 'undefined' && { isOnline }),
    };
    await setDoc(doc(this.firestore, `users/${uid}`), userData);
    return userData;
  }

  async updateUser(uid: string, data: Partial<User>) {
    try {
      await updateDoc(doc(this.firestore, `users/${uid}`), data);
    } catch (error) {
      console.error('Error updating user data: ', error);
      throw error;
    }
  }

  getUserData(uid: string): Observable<User | null> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef).pipe(
      map((data: any): User | null => {
        if (!data) return null;
        return {
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          emailVerified: data.emailVerified,
          isOnline: data.isOnline,
          photoURL: data.photoURL,
          hasUnreadMessages: data.hasUnreadMessages || [],
        };
      })
    );
  }

  mapFirestoreDataToUsers(userQuery: Query<DocumentData>): Observable<User[]> {
    return collectionData(userQuery).pipe(
      map((usersData) =>
        usersData.map(
          (data) =>
            ({
              uid: data['uid'],
              email: data['email'],
              displayName: data['displayName'],
              displayNameLower: data['displayNameLower'],
              emailVerified: data['emailVerified'],
              isOnline: data['isOnline'],
              photoURL: data['photoURL'],
              lastActive: data['lastActive'],
              hasUnreadMessages: data['hasUnreadMessages'],
            } as User)
        )
      )
    );
  }

  getUsers(searchTerm?: string): Observable<User[]> {
    let userQuery;
    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      userQuery = query(
        collection(this.firestore, 'users'),
        where('displayNameLower', '>=', lowerCaseTerm),
        where('displayNameLower', '<=', lowerCaseTerm + '\uf8ff')
      );
    } else {
      userQuery = collection(this.firestore, 'users');
    }
    return this.mapFirestoreDataToUsers(userQuery);
  }

  getUsersWithEmail(searchTerm?: string): Observable<User[]> {
    let userQuery;
    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      userQuery = query(
        collection(this.firestore, 'users'),
        where('email', '>=', lowerCaseTerm),
        where('email', '<=', lowerCaseTerm + '\uf8ff')
      );
    } else {
      userQuery = collection(this.firestore, 'users');
    }
    return this.mapFirestoreDataToUsers(userQuery);
  }

  getInactiveGuestUsers(): Observable<User[]> {
    const dateOneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const firestoreTimestampOneHourAgo = Timestamp.fromDate(dateOneHourAgo);
    const userQuery = query(
      collection(this.firestore, 'users'),
      where('displayName', '==', 'Guest'),
      where('lastActive', '<=', firestoreTimestampOneHourAgo)
    );

    return this.mapFirestoreDataToUsers(userQuery);
  }

  async setUserOnlineStatus(uid: string, isOnline: boolean) {
    const userRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(userRef, {
      isOnline: isOnline,
      lastActive: Timestamp.now(),
    });
  }

  updateLastActive(uid: string) {
    const userRef = doc(this.firestore, `users/${uid}`);
    updateDoc(userRef, {
      lastActive: Timestamp.now(),
    });
  }

  async changeEmail(newEmail: string) {
    const auth = getAuth();

    if (!auth.currentUser) {
      console.error('No user is signed in!');
      return;
    }

    try {
      await updateEmail(auth.currentUser, newEmail);
    } catch (error) {
      console.error('An unexpected error occurred. Please try again', error);
      throw error;
    }
  }

  async confirmReset(oobCode: string, newPassword: string) {
    console.log('Attempting to reset password with code:', oobCode);
    try {
      await confirmPasswordReset(this.auth, oobCode, newPassword);
      console.log('Password reset successful');
    } catch (error) {
      console.log('Error during password reset', error);
      throw error;
    }
  }
}
