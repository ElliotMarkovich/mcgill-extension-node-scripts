// Import the functions you need from the SDKs you need
import { createRequire } from 'node:module';
import axios, {isCancel, AxiosError} from 'axios';
const require = createRequire(import.meta.url);
const readXlsxFile = require('read-excel-file/node');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
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

const serviceAccount = require('privatekey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();


console.log("test");

const docRef = db.collection("data structures").doc("keyword trie");
console.log("test 2");
const docSnap = await docRef.get();
const docSnapData = docSnap.data();

console.log("test 2");

var prereq_map = new Object;
var postreq_map = new Object;
var text_map = new Object;

crawlCourseListPage(0);

function crawlCourseListPage(page_number){
  axios.get('https://www.mcgill.ca/study/2024-2025/courses/search?page=' + page_number)
  .then(async function (response) {
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
        var course_code = page_data.substring(course_code_start_index, course_code_end_index);
        addWordToTrie(course_code);
        console.log(course_code);
        text_map[course_code] = "<p>" + "Course: " + course_code + "</p>";
        console.log(text_map[course_code]);
        var new_course_code = course_code.substring(0, 4).toLowerCase() + "-" + course_code.substring(5, course_code.length).toLowerCase();
        var course_page_link = "https://www.mcgill.ca/study/2024-2025/courses/" + new_course_code;
        const course_page_return = await crawlCoursePage(course_page_link, course_code);
      }
    }
    if (page_number >= 528){
      const res = await docRef.set({ root: docSnapData.root });
      buildPostReqMap();
      console.log(postreq_map);
      for (var i = 0; i < Object.keys(postreq_map).length; i++){
        var course_code_key = Object.keys(postreq_map)[i];
        console.log(course_code_key);
        text_map[course_code_key] += "<p>" + "This course can be used as a prerequisite for: " + "</p>" + listPostReqs(course_code_key);
      }
      crawlCourseHistoricalDataSpreadsheet();
    }else{
      crawlCourseListPage(page_number + 1);
    }
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    
  });
}

function crawlCoursePage(page_link, page_course_code){
  axios.get(page_link)
  .then(function (response) {
    // handle success
    var page_data = response.data;
    var prereq_array = [];
    for (var i = 0; i < page_data.length - 12; i++){
      if (page_data.substring(i, i + 12) == "Prerequisite"){
        var end_reached = false;
        prereq_array = [];
        for (var j = i + 12; end_reached == false; j++){
          if ((page_data.substring(j, j + 25) == "/study/2024-2025/courses/") && (page_data.substring(j, j + 31) != "/study/2024-2025/courses/search")){
            var course_code_start_index = j + 25;
            var course_code_end_index = 0;
            var found_code = false;
            for (var k = course_code_start_index; found_code == false; k++){
              if (page_data.substring(k, k + 1) == ">"){
                course_code_end_index = k - 1;
                found_code = true;
              }
            }
            var course_code = (page_data.substring(course_code_start_index, course_code_start_index + 4) + " " + page_data.substring(course_code_start_index + 5, course_code_end_index)).toUpperCase();
            console.log(course_code);
            prereq_array.push(course_code);
          }
          if (page_data.substring(j, j + 4) == "</p>"){
            end_reached = true;
          }
        }
      }
    }
    if (prereq_array != undefined){
      prereq_map[page_course_code] = prereq_array;
    }
    return new Promise((resolve) => {
      resolve("resolved");
    })
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    
  });
}

function crawlCourseHistoricalDataSpreadsheet(){
  console.log("crawling spreadsheet");
  // File path.
  readXlsxFile('class-averages.xlsx').then((rows) => {
    // `rows` is an array of rows
    // each row being an array of cells.
    for (var i = rows.length - 2; i > 1; i--){
      var course_code = rows[i][1];
      if (course_code != rows[i+1][1]){
        var new_course_code = course_code.substring(0, 4) + " " + course_code.substring(4, course_code.length);
        var info_HTML = "<p>" + "Historical averages:" + "</p>";
        while (course_code == rows[i][1]){
          info_HTML += "<p>" + rows[i][2] + ": " + rows[i][3] + " (" + rows[i][4] + ")" + "</p>";
          i--;
        }
        i++;
        text_map[new_course_code] += info_HTML;
      }
    }
    console.log(text_map);
    console.log("Text map is above");
    fillCourseInfoDB();
    console.log("Done");
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
  });
}

function buildPostReqMap(){
  var key_array = Object.keys(prereq_map);
  for (var keys_index = 0; keys_index < key_array.length; keys_index++){
    var key = key_array[keys_index];
    var prereq_array = prereq_map[key];
    for (var array_index = 0; array_index < prereq_array.length; array_index++){
      var pre_req = prereq_array[array_index];
      if (postreq_map[pre_req] == undefined){
        postreq_map[pre_req] = [];
      }
      postreq_map[pre_req].push(key);
    }
  }
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

function listPostReqs(course_code){
  var postreq_array = postreq_map[course_code];
  var postreq_list_text = "<ul>";
  console.log("entering postreq list loop");
  console.log(postreq_array);
  for (var i = 0; i < postreq_array.length; i++){
    postreq_list_text += "<li>" + postreq_array[i] + "</li>";
  }
  postreq_list_text += "</ul>";
  return postreq_list_text;
}

async function fillCourseInfoDB(){
  console.log("filling in course info DB");
  var key_array = Object.keys(text_map);
  for (var keys_index = 0; keys_index < key_array.length; keys_index++){
    var course_code = key_array[keys_index];
    const info_doc = db.collection("keywords").doc(course_code);
    const res = await info_doc.set({ info: text_map[course_code] });
  }
}