import { auth, db } from "../../firebase/firebase.js";

import {
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export async function addStudent(name, roll, className, section){

const loginId = `${className}${section}@${roll}`;

const email = `${loginId}@trace.app`;

const password = "Trace@123";

const userCredential =
await createUserWithEmailAndPassword(
auth,
email,
password
);

await setDoc(doc(db,"students",userCredential.user.uid),{

name,
roll,
class:className,
section,
loginId

});

return{

loginId,
password

};

}