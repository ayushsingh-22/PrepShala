// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCn2RfHkT4qBqVRY0ryMmvOE3yynP40rhs",
  authDomain: "testshala-b5488.firebaseapp.com",
  projectId: "testshala-b5488",
  storageBucket: "testshala-b5488.appspot.com",
  messagingSenderId: "788042109464",
  appId: "1:788042109464:web:17ce182f4b32713881a96d",
  measurementId: "G-KCN2M7NH7T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };