// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { createRequire } from 'node:module';
import axios, {isCancel, AxiosError} from 'axios';
const require = createRequire(import.meta.url);
const readXlsxFile = require('read-excel-file/node');
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

const docRef = doc(db, "data structures", "keyword trie");
const docSnap = await getDoc(docRef);
const docSnapData = docSnap.data();


// File path.
readXlsxFile('class-averages.xlsx').then((rows) => {
  // `rows` is an array of rows
  // each row being an array of cells.
  for (var i = rows.length - 2; i > 1; i--){
    var course_code = rows[i][1];
    if (course_code != rows[i+1][1]){
      var new_course_code = course_code.substring(0, 4) + " " + course_code.substring(4, course_code.length);
      var info_HTML = "<p>" + "Course: " + new_course_code + " (" + rows[i][5] + " credits)" + "</p>"  + "<p>" + "Historical averages:" + "</p>";
      while (course_code == rows[i][1]){
        info_HTML += "<p>" + rows[i][2] + ": " + rows[i][3] + " (" + rows[i][4] + ")" + "</p>";
        i--;
      }
      i++;
      setDoc(doc(db, "keywords", new_course_code), { info: info_HTML });
    }
  }
})

crawlCourseListPage(0);

function crawlCourseListPage(page_number){
  console.log(page_number);
  axios.get('https://www.mcgill.ca/study/2024-2025/courses/search?page=' + page_number)
  .then(function (response) {
    // handle success
    var page_data = response.data;
    for (var i = 0; i < page_data.length - 25; i++){
      if ((page_data.substring(i, i + 25) == "/study/2024-2025/courses/") && (page_data.substring(i, i + 31) != "/study/2024-2025/courses/search")){
        var course_code_start_index = 0;
        var course_code_end_index = 0;
        var space_count = 0;
        var found_code = false;
        for (var j = i + 25; found_code == false; j++){
          if (page_data.substring(j, j + 1) == ">"){
            course_code_start_index = j + 1;
          }else if (page_data.substring(j, j + 1) == " "){
            if (space_count == 0){
              space_count++;
            }else{
              course_code_end_index = j;
              found_code = true;
            }
          }
        }
        addWordToTrie(page_data.substring(course_code_start_index, course_code_end_index));
        console.log(page_data.substring(course_code_start_index, course_code_end_index));
      }
    }
    if (page_number >= 528){
      setDoc(docRef, { root: docSnapData.root });
    }else{
      crawlCourseListPage(page_number + 1);
    }
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
}

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