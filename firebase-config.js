// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"; // הוספנו גם את Auth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzgdcJASKzZz9azdNrmrJz3MWhlBcdvyg",
  authDomain: "fitness-auth-54d4d.firebaseapp.com",
  projectId: "fitness-auth-54d4d",
  storageBucket: "fitness-auth-54d4d.firebasestorage.app",
  messagingSenderId: "355871344430",
  appId: "1:355871344430:web:3cedacd33df478bf665cbf",
  measurementId: "G-QXP15SPSHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // אתחול של מערכת ההתחברות

// ייצוא המשתנים כדי שנוכל להשתמש בהם בקבצים אחרים
export { app, auth, analytics };