import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the functions you need from the SDKs you need


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBa2-J46T6aQV87Sek9tHkG6pI7uf7xzEw",
  authDomain: "aiy-chat-e9077.firebaseapp.com",
  projectId: "aiy-chat-e9077",
  storageBucket: "aiy-chat-e9077.firebasestorage.app",
  messagingSenderId: "1060302897422",
  appId: "1:1060302897422:web:1186cfea356b193200575f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

