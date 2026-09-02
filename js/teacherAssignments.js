import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   LOAD TEACHER ASSIGNMENTS
===================================================== */

export async function loadTeacherAssignments(){

    /* Hide dashboard */

    document.getElementById("summarySection").style.display =
        "none";

    document.getElementById("dashboardHome").style.display =
        "none";


    /* Show content */

    const content =
        document.getElementById("content");

    content.style.display =
        "block";


    /* Heading */

    document.querySelector(".topbar h1").textContent =
        "Teacher Assigned Classes";

    document.querySelector(".topbar p").textContent =
        "Assign teachers to classes and sections.";


    content.innerHTML = `

        <!-- ===============================
             ASSIGN TEACHER
        ================================ -->

        <div class="panel">

            <h1>📋 Assign Teacher</h1>

            <p>
                Select a teacher and assign a class,
                section and subject.
            </p>


            <div class="form-box">

                <label>
                    <b>👩‍🏫 Teacher</b>
                </label>

                <select id="teacherSelect">

                    <option value="">
                        Loading teachers...
                    </option>

                </select>


                <label>
                    <b>🎓 Class</b>
                </label>

                <select id="classSelect">

                    <option value="">
                        Select Class
                    </option>

                    <option value="3">
                        Class 3
                    </option>

                    <option value="4">
                        Class 4
                    </option>

                    <option value="5">
                        Class 5
                    </option>

                </select>


                <label>
                    <b>🏷️ Section</b>
                </label>

                <select id="sectionSelect">

                    <option value="">
                        Select Section
                    </option>

                    <option value="A">
                        Section A
                    </option>

                    <option value="B">
                        Section B
                    </option>

                    <option value="C">
                        Section C
                    </option>

                </select>


                <label>
                    <b>📚 Subject</b>
                </label>

                <select id="subjectSelect">

                    <option value="English">
                        English
                    </option>

                    <option value="Hindi">
                        Hindi
                    </option>

                </select>


                <br><br>


                <button id="assignTeacherBtn">

                    📌 Assign Teacher

                </button>

            </div>

        </div>


        <!-- ===============================
             ASSIGNED CLASSES
        ================================ -->

        <div class="panel">

            <h2>📋 Current Teacher Assignments</h2>

            <br>

            <div style="
                overflow-x:auto;
            ">

                <table class="class-table">

                    <thead>

                        <tr>

                            <th>Teacher</th>

                            <th>Class</th>

                            <th>Section</th>

                            <th>Subject</th>

                            <th>Action</th>

                        </tr>

                    </thead>


                    <tbody id="assignmentTable">

                    </tbody>

                </table>

            </div>

        </div>

    `;


    /* Load teachers */

    await loadTeachers();


    /* Load existing assignments */

    await showAssignments();


    /* Button */

    document
        .getElementById("assignTeacherBtn")
        .addEventListener(
            "click",
            assignTeacher
        );

}


/* =====================================================
   LOAD TEACHERS
===================================================== */

async function loadTeachers(){

    const select =
        document.getElementById(
            "teacherSelect"
        );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "teachers"
                )
            );


        select.innerHTML = `

            <option value="">
                Select Teacher
            </option>

        `;


        snapshot.forEach(
            teacherDoc => {

                const data =
                    teacherDoc.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    teacherDoc.id;


                option.textContent =
                    data.name ||
                    "Unnamed Teacher";


                select.appendChild(
                    option
                );

            }
        );


        if(snapshot.empty){

            select.innerHTML = `

                <option value="">
                    No teachers found
                </option>

            `;

        }

    }


    catch(error){

        console.error(
            "Teacher loading error:",
            error
        );


        select.innerHTML = `

            <option value="">
                Unable to load teachers
            </option>

        `;

    }

}


/* =====================================================
   ASSIGN TEACHER
===================================================== */

async function assignTeacher(){

    const teacherId =
        document.getElementById(
            "teacherSelect"
        ).value;


    const studentClass =
        document.getElementById(
            "classSelect"
        ).value;


    const section =
        document.getElementById(
            "sectionSelect"
        ).value;


    const subject =
        document.getElementById(
            "subjectSelect"
        ).value;


    if(
        !teacherId ||
        !studentClass ||
        !section ||
        !subject
    ){

        alert(
            "Please select Teacher, Class, Section and Subject."
        );

        return;

    }


    try {

        /* =============================================
           GET TEACHER
        ============================================== */

        const teacherSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "teachers"
                    ),
                    where(
                        "__name__",
                        "==",
                        teacherId
                    )
                )
            );


        let teacherName =
            "Teacher";


        teacherSnapshot.forEach(
            teacherDoc => {

                const data =
                    teacherDoc.data();


                teacherName =
                    data.name ||
                    "Teacher";

            }
        );


        /* =============================================
           CHECK DUPLICATE
        ============================================== */

        const assignmentsSnapshot =
            await getDocs(
                collection(
                    db,
                    "teacherAssignments"
                )
            );


        let duplicate =
            false;


        assignmentsSnapshot.forEach(
            assignmentDoc => {

                const data =
                    assignmentDoc.data();


                if(

                    data.teacherId ===
                    teacherId &&

                    String(data.class) ===
                    String(studentClass) &&

                    String(data.section)
                        .toUpperCase() ===
                    String(section)
                        .toUpperCase() &&

                    data.subject ===
                    subject

                ){

                    duplicate =
                        true;

                }

            }
        );


        if(duplicate){

            alert(
                "⚠️ This teacher is already assigned to this class, section and subject."
            );

            return;

        }


        /* =============================================
           SAVE ASSIGNMENT
        ============================================== */

        await addDoc(

            collection(
                db,
                "teacherAssignments"
            ),

            {

                teacherId:
                    teacherId,

                teacherName:
                    teacherName,

                class:
                    studentClass,

                section:
                    section,

                subject:
                    subject,

                active:
                    true,

                assignedAt:
                    new Date()

            }

        );


        alert(
            "✅ Teacher assigned successfully!"
        );


        await showAssignments();

    }


    catch(error){

        console.error(
            "Teacher assignment error:",
            error
        );


        alert(
            "❌ Unable to assign teacher.\n\n" +
            error.message
        );

    }

}


/* =====================================================
   SHOW ASSIGNMENTS
===================================================== */

async function showAssignments(){

    const table =
        document.getElementById(
            "assignmentTable"
        );


    if(!table) return;


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                style="text-align:center;"
            >

                Loading assignments...

            </td>

        </tr>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "teacherAssignments"
                )
            );


        table.innerHTML = "";


        if(snapshot.empty){

            table.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                        text-align:center;
                        padding:25px;
                        "
                    >

                        📭 No teacher assignments yet.

                    </td>

                </tr>

            `;

            return;

        }


        snapshot.forEach(
            assignmentDoc => {

                const data =
                    assignmentDoc.data();


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${data.teacherName || ""}
                    </td>

                    <td>
                        ${data.class || ""}
                    </td>

                    <td>
                        ${data.section || ""}
                    </td>

                    <td>
                        ${data.subject || ""}
                    </td>

                    <td>

                        <button
                            class="deleteTeacherAssignmentBtn"
                        >

                            🗑 Remove

                        </button>

                    </td>

                `;


                row
                    .querySelector(
                        ".deleteTeacherAssignmentBtn"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            deleteAssignment(
                                assignmentDoc.id
                            );

                        }
                    );


                table.appendChild(
                    row
                );

            }
        );

    }


    catch(error){

        console.error(
            "Show teacher assignments error:",
            error
        );


        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                    text-align:center;
                    color:#dc2626;
                    padding:25px;
                    "
                >

                    ❌ Unable to load teacher assignments.

                </td>

            </tr>

        `;

    }

}


/* =====================================================
   DELETE ASSIGNMENT
===================================================== */

async function deleteAssignment(id){

    const confirmDelete =
        confirm(
            "Remove this teacher assignment?"
        );


    if(!confirmDelete)
        return;


    try {

        await deleteDoc(

            doc(
                db,
                "teacherAssignments",
                id
            )

        );


        alert(
            "🗑 Teacher assignment removed."
        );


        await showAssignments();

    }


    catch(error){

        console.error(
            "Delete teacher assignment error:",
            error
        );


        alert(
            "❌ Unable to remove teacher assignment."
        );

    }

}