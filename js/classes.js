import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* ===========================
   LOAD CLASSES PAGE
=========================== */

export async function loadClasses() {

    // Hide dashboard
    document.getElementById("summarySection").style.display = "none";
    document.getElementById("dashboardHome").style.display = "none";
document.querySelector(".topbar h1").textContent = "Classes";
document.querySelector(".topbar p").textContent = "Manage classes, sections, and student groups.";

    // Show content area
    const content = document.getElementById("content");
    content.style.display = "block";

    content.innerHTML = `

        <h1>📚 Classes</h1>

        <div class="form-box">

            <label>Class</label>

            <select id="className">
                <option value="">Select Class</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
            </select>

            <label>Section</label>

            <select id="sectionName">
                <option value="">Select Section</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
            </select>

            <button id="saveClassBtn">➕ Save Class</button>

        </div>

        <div class="panel">

            <h2>📋 Class List</h2>

            <table class="class-table">

                <thead>
                    <tr>
                        <th>Class</th>
                        <th>Section</th>
                        <th>Teacher</th>
                        <th>Students</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody id="classTable"></tbody>

            </table>

        </div>
    `;

    // Button event
    document
        .getElementById("saveClassBtn")
        .addEventListener("click", saveClass);

    // Load table
    await showClasses();
}

/* ===========================
   SAVE CLASS
=========================== */

async function saveClass() {

    const className =
        document.getElementById("className").value;

    const section =
        document.getElementById("sectionName").value;

    if (className === "" || section === "") {
        alert("Select Class and Section");
        return;
    }

    const id = className + section;

    await setDoc(doc(db, "classes", id), {

        class: className,
        section: section,
        teacher: "",
        studentCount: 0

    });

    alert("Class Saved Successfully");

    await showClasses();
}

/* ===========================
   SHOW CLASSES
=========================== */

async function showClasses() {

    const table = document.getElementById("classTable");

    if (!table) return;

    table.innerHTML = "";

    const snapshot =
        await getDocs(collection(db, "classes"));

    snapshot.forEach((item) => {

        const data = item.data();

        table.innerHTML += `
            <tr>
                <td>${data.class}</td>
                <td>${data.section}</td>
                <td>${data.teacher || "-"}</td>
                <td>${data.studentCount || 0}</td>
                <td>
                    <button onclick="deleteClass('${item.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

/* ===========================
   DELETE CLASS
=========================== */

window.deleteClass = async function(id) {

    const confirmDelete = confirm("Delete this class?");

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "classes", id));

    await showClasses();
};