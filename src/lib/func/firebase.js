import firebase from 'firebase/app';
import { firebaseConfig } from './const';
export default !firebase?.apps?.length
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app();