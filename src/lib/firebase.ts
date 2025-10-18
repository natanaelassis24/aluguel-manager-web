import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCZbGCPeiprjUaTVUu5T8Gm1XFBTfrvnh8',
  authDomain: 'flutter-ai-5516d.firebaseapp.com',
  projectId: 'flutter-ai-5516d',
  storageBucket: 'flutter-ai-5516d.appspot.com',
  messagingSenderId: '1066260763361',
  appId: '1:1066260763361:web:xxxxxxxxxxxxxx',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
