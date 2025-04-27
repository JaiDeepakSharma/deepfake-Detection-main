// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6B_nRjTRmyWZ-DBPMyGOpThc0qHK3ZXQ",
  authDomain: "fir-example-65f1b.firebaseapp.com",
  projectId: "fir-example-65f1b",
  storageBucket: "fir-example-65f1b.firebasestorage.app",
  messagingSenderId: "1024388489680",
  appId: "1:1024388489680:web:cdee3bed514ac4dc1ed9d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//input 
const email = document.getElementById("email");
const password = document.getElementById("password");

//submit
const submit = document.getElementById("submit");
submit.addEventListener("click", (e) => {
  e.preventDefault();
  const emailValue = email.value;
  const passwordValue = password.value;
  console.log(emailValue, passwordValue);
  if (emailValue === "" || passwordValue === "") {
    alert("Please fill in all fields");
  } else {
    // Register the user
    registerUser(emailValue, passwordValue, (error) => {
      if (error) {
        console.error("Error registering user:", error);
        alert("Error registering user: " + error.message);
      } else {
        alert("User registered successfully!");
        window.location.href = "login.html"; // Redirect to login page
      }
    }
  } 