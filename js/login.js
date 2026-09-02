import { auth } from "../firebase/firebase.js";

import {
signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e)=>{

e.preventDefault();

const email=document.getElementById("email").value.trim();

const password=document.getElementById("password").value;

try{

await signInWithEmailAndPassword(auth,email,password);

window.location.href="admin/dashboard.html";

}
catch(error){

alert(error.message);

}

});