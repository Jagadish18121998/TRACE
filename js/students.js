import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    setDoc,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   LOAD STUDENTS MODULE
===================================================== */

export async function loadStudents() {

    /* Hide dashboard */

    document.querySelector(".summary").style.display = "none";

    document.querySelector(".dashboard-grid").style.display = "none";


    /* Change heading */

    document.querySelector(".topbar h1").textContent =
        "Student Management";

    document.querySelector(".topbar p").textContent =
        "View and manage TRACE students.";


    /* Show content */

    const content =
        document.getElementById("content");

    content.style.display = "block";


    content.innerHTML = `

        <h1>👨‍🎓 Student Management</h1>


        <!-- =========================
             SEARCH / FILTERS
        ========================== -->

        <div class="form-box">

            <h3>🔍 Find Students</h3>


            <select id="studentClass">

                <option value="">
                    All Classes
                </option>

                <option value="3">Class 3</option>

                <option value="4">Class 4</option>

                <option value="5">Class 5</option>

            </select>


            <select id="studentSection">

                <option value="">
                    All Sections
                </option>

                <option value="A">Section A</option>

                <option value="B">Section B</option>

                <option value="C">Section C</option>

            </select>


            <input
                type="text"
                id="studentSearch"
                placeholder="Search Name or Admission No"
            >

        </div>


        <br>


        <!-- =========================
             STUDENT COUNT
        ========================== -->

        <div style="
            margin-bottom:15px;
            font-weight:600;
            color:#475569;
        ">

            👥 Students Found:
            <span id="visibleStudentCount">0</span>

        </div>


        <!-- =========================
             STUDENT TABLE
        ========================== -->

        <div style="overflow-x:auto;">

            <table class="class-table">

                <thead>

                    <tr>

                        <th>Admission No</th>

                        <th>Roll No</th>

                        <th>Name</th>

                        <th>Class</th>

                        <th>Section</th>

                        <th>Login ID</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody id="studentTable">

                    <tr>

                        <td colspan="8"
                            style="text-align:center;">

                            Loading students...

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>


        <!-- =========================
             IMPORT
        ========================== -->

        <br>

        <div class="form-box">

            <h3>📂 Import Students</h3>

            <p style="
                color:#64748b;
                margin-bottom:12px;
            ">

                Add students from your Excel/CSV file.

            </p>


            <input
                type="file"
                id="studentFile"
                accept=".xlsx,.xls,.csv"
            >


            <button id="importStudentsBtn">

                📂 Import Students

            </button>

        </div>

    `;


    /* =================================================
       EVENT LISTENERS
    ================================================= */

    document
        .getElementById("importStudentsBtn")
        .addEventListener(
            "click",
            importStudents
        );


    document
        .getElementById("studentClass")
        .addEventListener(
            "change",
            showStudents
        );


    document
        .getElementById("studentSection")
        .addEventListener(
            "change",
            showStudents
        );


    document
        .getElementById("studentSearch")
        .addEventListener(
            "input",
            showStudents
        );


    /* Load students */

    await showStudents();

}


/* =====================================================
   SHOW STUDENTS
===================================================== */

async function showStudents() {

    const table =
        document.getElementById(
            "studentTable"
        );


    if(!table) return;


    table.innerHTML = `

        <tr>

            <td colspan="8"
                style="text-align:center;">

                Loading students...

            </td>

        </tr>

    `;


    try {

        const selectedClass =
            document.getElementById(
                "studentClass"
            ).value;


        const selectedSection =
            document.getElementById(
                "studentSection"
            ).value;


        const search =
            document.getElementById(
                "studentSearch"
            ).value
            .toLowerCase()
            .trim();


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );


        table.innerHTML = "";


        let visibleCount = 0;


        snapshot.forEach(
            studentDoc => {

                const data =
                    studentDoc.data();


                /* =========================
                   FILTER CLASS
                ========================== */

                const matchClass =
                    selectedClass === "" ||
                    String(data.class)
                        .trim() ===
                    selectedClass;


                /* =========================
                   FILTER SECTION
                ========================== */

                const matchSection =
                    selectedSection === "" ||
                    String(data.section)
                        .trim()
                        .toUpperCase() ===
                    selectedSection;


                /* =========================
                   SEARCH
                ========================== */

                const name =
                    String(
                        data.name || ""
                    ).toLowerCase();


                const admission =
                    String(
                        data.admissionNo || ""
                    ).toLowerCase();


                const matchSearch =
                    search === "" ||
                    name.includes(search) ||
                    admission.includes(search);


                if(
                    matchClass &&
                    matchSection &&
                    matchSearch
                ){

                    visibleCount++;


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${data.admissionNo || ""}
                        </td>

                        <td>
                            ${data.rollNo || ""}
                        </td>

                        <td>
                            ${data.name || ""}
                        </td>

                        <td>
                            ${data.class || ""}
                        </td>

                        <td>
                            ${data.section || ""}
                        </td>

                        <td>
                            ${data.loginId || ""}
                        </td>

                        <td>
                            ${data.status || "Active"}
                        </td>

                        <td>

                            <button
                                class="viewStudentBtn"
                                data-id="${studentDoc.id}"
                            >

                                👁 View

                            </button>

                        </td>

                    `;


                    table.appendChild(
                        row
                    );


                    /* View button */

                    row
                        .querySelector(
                            ".viewStudentBtn"
                        )
                        .addEventListener(
                            "click",
                            () => {

                                viewStudent(
                                    studentDoc.id
                                );

                            }
                        );

                }

            }
        );


        /* No students */

        if(visibleCount === 0){

            table.innerHTML = `

                <tr>

                    <td colspan="8"
                        style="
                        text-align:center;
                        padding:25px;
                        ">

                        📭 No students found.

                    </td>

                </tr>

            `;

        }


        document.getElementById(
            "visibleStudentCount"
        ).innerText =
            visibleCount;


    }

    catch(error){

        console.error(
            "Error loading students:",
            error
        );


        table.innerHTML = `

            <tr>

                <td colspan="8"
                    style="
                    text-align:center;
                    color:#dc2626;
                    padding:25px;
                    ">

                    ❌ Unable to load students.

                </td>

            </tr>

        `;

    }

}


/* =====================================================
   VIEW STUDENT
===================================================== */

async function viewStudent(id){

    try {

        const studentDoc =
            await getDoc(
                doc(
                    db,
                    "students",
                    id
                )
            );


        if(!studentDoc.exists()){

            alert(
                "Student record not found."
            );

            return;

        }


        const data =
            studentDoc.data();


        alert(

`👨‍🎓 STUDENT DETAILS

Admission No : ${data.admissionNo || ""}

Roll No : ${data.rollNo || ""}

Name : ${data.name || ""}

Class : ${data.class || ""}

Section : ${data.section || ""}

Login ID : ${data.loginId || ""}

Status : ${data.status || ""}`

        );

    }

    catch(error){

        console.error(
            "View student error:",
            error
        );


        alert(
            "Unable to load student details."
        );

    }

}


/* =====================================================
   IMPORT STUDENTS
===================================================== */

async function importStudents(){

    const file =
        document.getElementById(
            "studentFile"
        ).files[0];


    if(!file){

        alert(
            "Please select an Excel or CSV file."
        );

        return;

    }


    /* Check XLSX library */

    if(typeof XLSX === "undefined"){

        alert(
            "Excel library is not loaded."
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        async function(event){

        try {

            const data =
                new Uint8Array(
                    event.target.result
                );


            const workbook =
                XLSX.read(
                    data,
                    {
                        type:"array"
                    }
                );


            const sheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];


            const students =
                XLSX.utils.sheet_to_json(
                    sheet
                );


            let imported = 0;

            let skipped = 0;


            const existingStudents =
                await getDocs(
                    collection(
                        db,
                        "students"
                    )
                );


            const existingIds =
                new Set();


            existingStudents.forEach(
                existingDoc => {

                    existingIds.add(
                        existingDoc.id
                    );

                }
            );


            for(
                const student
                of students
            ){

                /* Accept your actual column names */

                const admissionNo =
                    String(
                        student["Admn No"] ??
                        student["Admission No"] ??
                        student["Admission Number"] ??
                        ""
                    ).trim();


                const rollNo =
                    student["Roll No"] ??
                    student["Roll Number"] ??
                    "";


                const name =
                    student["Name"] ??
                    "";


                const studentClass =
                    student["Class"] ??
                    "";


                const section =
                    student["Section"] ??
                    "";


                if(!admissionNo){

                    continue;

                }


                if(existingIds.has(admissionNo)){

                    skipped++;

                    continue;

                }


                await setDoc(

                    doc(
                        db,
                        "students",
                        admissionNo
                    ),

                    {

                        admissionNo:
                            admissionNo,

                        rollNo:
                            rollNo,

                        name:
                            name,

                        class:
                            studentClass,

                        section:
                            section,

                        loginId:
                            `${studentClass}${section}@${rollNo}`,

                        password:
                            "Trace@123",

                        status:
                            "Active"

                    }

                );


                imported++;

            }


            alert(

                "✅ Import Completed\n\n" +

                "Imported : " +
                imported +

                "\nSkipped : " +
                skipped

            );


            document.getElementById(
                "studentFile"
            ).value = "";


            await showStudents();

        }


        catch(error){

            console.error(
                "Import error:",
                error
            );


            alert(
                "❌ Import Failed\n\n" +
                error.message
            );

        }

    };


    reader.readAsArrayBuffer(
        file
    );

}