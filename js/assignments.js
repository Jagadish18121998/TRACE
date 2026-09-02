import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   LOAD ASSIGN PASSAGES MODULE
===================================================== */

export async function loadAssignments() {

    /* Hide dashboard */

    document.getElementById("summarySection").style.display =
        "none";

    document.getElementById("dashboardHome").style.display =
        "none";


    /* Heading */

    document.querySelector(".topbar h1").textContent =
        "Assign Passages";

    document.querySelector(".topbar p").textContent =
        "Assign reading passages to a class and section.";


    /* Content */

    const content =
        document.getElementById("content");

    content.style.display = "block";


    content.innerHTML = `

        <!-- ===============================
             ASSIGN PASSAGE
        ================================ -->

        <div class="panel">

            <h1>📖 Assign Reading Passage</h1>

            <p>
                Select a passage and assign it
                to a particular class and section.
            </p>


            <div class="form-box">

                <label>
                    <b>🎓 Select Class</b>
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
                    <b>🏷️ Select Section</b>
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
                    <b>📖 Select Passage</b>
                </label>

                <select id="passageSelect">

                    <option value="">
                        Loading passages...
                    </option>

                </select>


                <br><br>


                <button id="assignBtn">

                    📌 Assign Passage

                </button>

            </div>

        </div>


        <!-- ===============================
             CURRENT ASSIGNMENTS
        ================================ -->

        <div class="panel">

            <h2>📋 Current Assignments</h2>

            <br>


            <div style="
                overflow-x:auto;
            ">

                <table class="class-table">

                    <thead>

                        <tr>

                            <th>Class</th>

                            <th>Section</th>

                            <th>Passage</th>

                            <th>Status</th>

                            <th>Action</th>

                        </tr>

                    </thead>


                    <tbody id="assignmentTable">

                    </tbody>

                </table>

            </div>

        </div>

    `;


    /* Load passages */

    await loadPassageOptions();


    /* Show assignments */

    await showAssignments();


    /* Assign button */

    document
        .getElementById("assignBtn")
        .addEventListener(
            "click",
            assignPassage
        );

}


/* =====================================================
   LOAD PASSAGE OPTIONS
===================================================== */

async function loadPassageOptions(){

    const select =
        document.getElementById(
            "passageSelect"
        );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "passages"
                )
            );


        select.innerHTML = `

            <option value="">
                Select Passage
            </option>

        `;


        snapshot.forEach(
            passageDoc => {

                const data =
                    passageDoc.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    passageDoc.id;


                option.textContent =
                    `${data.title || "Untitled"} — Class ${data.class || ""} ${data.section || ""}`;


                select.appendChild(
                    option
                );

            }
        );


        if(snapshot.empty){

            select.innerHTML = `

                <option value="">
                    No passages available
                </option>

            `;

        }

    }


    catch(error){

        console.error(
            "Load passages error:",
            error
        );


        select.innerHTML = `

            <option value="">
                Unable to load passages
            </option>

        `;

    }

}


/* =====================================================
   ASSIGN PASSAGE
===================================================== */

async function assignPassage(){

    const studentClass =
        document.getElementById(
            "classSelect"
        ).value;


    const section =
        document.getElementById(
            "sectionSelect"
        ).value;


    const passageId =
        document.getElementById(
            "passageSelect"
        ).value;


    if(
        !studentClass ||
        !section ||
        !passageId
    ){

        alert(
            "Please select Class, Section and Passage."
        );

        return;

    }


    try {

        /* Get selected passage */

        const passageSnapshot =
            await getDocs(
                collection(
                    db,
                    "passages"
                )
            );


        let selectedPassage = null;


        passageSnapshot.forEach(
            passageDoc => {

                if(
                    passageDoc.id ===
                    passageId
                ){

                    selectedPassage = {
                        id: passageDoc.id,
                        ...passageDoc.data()
                    };

                }

            }
        );


        if(!selectedPassage){

            alert(
                "Selected passage could not be found."
            );

            return;

        }


        /* Check duplicate */

        const assignmentsSnapshot =
            await getDocs(
                collection(
                    db,
                    "assignments"
                )
            );


        let alreadyAssigned = false;


        assignmentsSnapshot.forEach(
            assignmentDoc => {

                const data =
                    assignmentDoc.data();


                if(
                    String(data.class) ===
                        String(studentClass) &&

                    String(data.section)
                        .toUpperCase() ===
                        String(section)
                            .toUpperCase() &&

                    data.passageId ===
                        passageId
                ){

                    alreadyAssigned = true;

                }

            }
        );


        if(alreadyAssigned){

            alert(
                "⚠️ This passage is already assigned to this class and section."
            );

            return;

        }


        /* Save assignment */

        await addDoc(

            collection(
                db,
                "assignments"
            ),

            {

                class:
                    studentClass,

                section:
                    section,

                passageId:
                    passageId,

                passageTitle:
                    selectedPassage.title || "",

                assignedAt:
                    serverTimestamp(),

                active:
                    true

            }

        );


        alert(
            "✅ Passage assigned successfully!"
        );


        await showAssignments();

    }


    catch(error){

        console.error(
            "Assignment error:",
            error
        );


        alert(
            "❌ Unable to assign passage.\n\n" +
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
                    "assignments"
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

                        📭 No passages assigned yet.

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
                        ${data.class || ""}
                    </td>

                    <td>
                        ${data.section || ""}
                    </td>

                    <td>
                        <b>
                            ${data.passageTitle || ""}
                        </b>
                    </td>

                    <td>

                        ${
                            data.active === false
                            ? "🔴 Inactive"
                            : "🟢 Active"
                        }

                    </td>

                    <td>

                        <button
                            class="deleteAssignmentBtn"
                        >

                            🗑 Remove

                        </button>

                    </td>

                `;


                row
                    .querySelector(
                        ".deleteAssignmentBtn"
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
            "Show assignments error:",
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

                    ❌ Unable to load assignments.

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
            "Remove this passage assignment?"
        );


    if(!confirmDelete) return;


    try {

        await deleteDoc(

            doc(
                db,
                "assignments",
                id
            )

        );


        alert(
            "🗑 Assignment removed."
        );


        await showAssignments();

    }


    catch(error){

        console.error(
            "Delete assignment error:",
            error
        );


        alert(
            "❌ Unable to remove assignment."
        );

    }

}