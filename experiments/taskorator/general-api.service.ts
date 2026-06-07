import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class GeneralApiService {
  constructor(private firestore: Firestore) {}

  async createDocument(userId: string, docName: string, obj: any) {
    const firestore = this.firestore;
    if (!userId) {
      throw new Error('No user id in user credentials @registerUser()');
    }
    const url = `users/${userId}/${docName}/${userId}`;
    const ref = doc(firestore, url);
    await setDoc(ref, obj);
  }

  async getDocument(userId: string, docName: string): Promise<any | null> {
    const url = `users/${userId}/${docName}/${userId}`;
    const treeDocRef = doc(this.firestore, url);
    try {
      const docSnap = await getDoc(treeDocRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to get tree:', error);
      return null;
    }
  }
}
