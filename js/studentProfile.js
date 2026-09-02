import { db } from "../firebase/firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export async function viewStudent(id) {

    const studentDoc = await getDoc(doc(db, "students", id));

    const data = studentDoc.data();

    const content = document.getElementById("content");

    content.innerHTML = `

<h1>👨‍🎓 Student Profile</h1>

<div class="profile-card">

<h2>${data.name}</h2>

<table class="class-table">

<tr>
<td><b>Admission No</b></td>
<td>${data.admissionNo}</td>
</tr>

<tr>
<td><b>Roll No</b></td>
<td>${data.rollNo}</td>
</tr>

<tr>
<td><b>Class</b></td>
<td>${data.class}</td>
</tr>

<tr>
<td><b>Section</b></td>
<td>${data.section}</td>
</tr>

<tr>
<td><b>Login ID</b></td>
<td>${data.loginId}</td>
</tr>

<tr>
<td><b>Status</b></td>
<td>${data.status}</td>
</tr>

</table>

<br>

<button id="backStudentsBtn">
⬅ Back to Students
</button>

</div>

`;

    document
        .getElementById("backStudentsBtn")
        .addEventListener("click", async () => {

            const module = await import("./students.js");

            module.loadStudents();

        });

}