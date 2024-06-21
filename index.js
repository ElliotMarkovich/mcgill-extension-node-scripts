// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmDr0Md_-uk75-1VQ89wi6K7VhiCJ4R9I",
  authDomain: "mcgill-extension-database.firebaseapp.com",
  databaseURL: "https://mcgill-extension-database-default-rtdb.firebaseio.com",
  projectId: "mcgill-extension-database",
  storageBucket: "mcgill-extension-database.appspot.com",
  messagingSenderId: "401565708495",
  appId: "1:401565708495:web:e9a8dc3cd73b8d7b8447ba",
  measurementId: "G-3T2RJ80XTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore();


console.log("test");

setDoc(doc(db, "data structures/write test document"), { test: "testing"});

const keyword_array = ["string", "another string", "Jonathan", "play yard", "r space", "Minor"];

const docRef = doc(db, "data structures", "keyword trie");
const docSnap = await getDoc(docRef);
const docSnapData = docSnap.data();

for(var index = 0; index < keyword_array.length; index++){
  addWordToTrie(keyword_array[index]);
}

console.log(docSnapData.root);

setDoc(docRef, { root: docSnapData.root});

function addWordToTrie(word){
  var buildNode = docSnapData.root;
  for (var i = 0; i < word.length; i++){
    var letter = word.substring(i, i + 1);
    if(buildNode[letter] == undefined){
      buildNode[letter] = new Object;
    }
    buildNode = buildNode[letter];
  }
  return docSnapData.root;
}