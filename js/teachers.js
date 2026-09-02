import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   LOAD TEACHERS
===================================================== */

export async function loadTeachers(){

    document.getElementById("summarySection").style.display = "none";
    document.getElementById("dashboardHome").style.display = "none";

    const content =
        document.getElementById("content");

    content.style.display = "block";

    document.querySelector(".topbar h1").textContent =
        "Teachers";

    document.querySelector(".topbar p").textContent =
        "Manage teacher accounts and login credentials.";


    content.innerHTML = `

        <div class="panel">

            <h1>👩‍🏫 Teacher Management</h1>

            <p>
                Create teacher accounts and manage
                their login credentials.
            </p>


            <div class="form-box">

                <h3>
                    ➕ Add Teacher
                </h3>


                <input
                    type="text"
                    id="teacherName"
                    placeholder="Teacher Name"
                >


                <input
                    type="text"
                    id="teacherLoginId"
                    placeholder="Teacher ID e.g. T001"
                >


                <input
                    type="password"
                    id="teacherPassword"
                    placeholder="Password"
                >


                <button id="saveTeacherBtn">

                    ➕ Create Teacher

                </button>

            </div>

        </div>


        <div class="panel">

            <h2>
                👩‍🏫 Teacher Accounts
            </h2>


            <table class="class-table">

                <thead>

                    <tr>

                        <th>
                            Teacher Name
                        </th>

                        <th>
                            Teacher ID
                        </th>

                        <th>
                            Password
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Action
                        </th>

                    </tr>

                </thead>


                <tbody id="teacherTable">

                </tbody>

            </table>

        </div>

    `;


    document
        .getElementById("saveTeacherBtn")
        .addEventListener(
            "click",
            saveTeacher
        );


    await showTeachers();

}


/* =====================================================
   CREATE TEACHER
===================================================== */

async function saveTeacher(){

    const name =
        document
            .getElementById("teacherName")
            .value
            .trim();


    const teacherId =
        document
            .getElementById("teacherLoginId")
            .value
            .trim()
            .toUpperCase();


    const password =
        document
            .getElementById("teacherPassword")
            .value
            .trim();


    if(
        !name ||
        !teacherId ||
        !password
    ){

        alert(
            "Please enter Teacher Name, Teacher ID and Password."
        );

        return;

    }


    try{

        /* Check duplicate Teacher ID */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "teachers"
                )
            );


        const duplicate =
            snapshot.docs.some(
                teacherDoc => {

                    const data =
                        teacherDoc.data();


                    return String(
                        data.teacherId ||
                        ""
                    )
                    .toUpperCase()
                    ===
                    teacherId;

                }
            );


        if(duplicate){

            alert(
                "This Teacher ID already exists."
            );

            return;

        }


        await addDoc(
            collection(
                db,
                "teachers"
            ),
            {

                name:

                    name,

                teacherId:

                    teacherId,

                password:

                    password,

                status:

                    "Active",

                createdAt:

                    new Date()

            }
        );


        alert(
            "Teacher account created successfully!"
        );


        document
            .getElementById("teacherName")
            .value = "";


        document
            .getElementById("teacherLoginId")
            .value = "";


        document
            .getElementById("teacherPassword")
            .value = "";


        await showTeachers();

    }

    catch(error){

        console.error(
            "Teacher creation error:",
            error
        );


        alert(
            "Unable to create teacher.\n\n" +
            error.message
        );

    }

}


/* =====================================================
   SHOW TEACHERS
===================================================== */

async function showTeachers(){

    const table =
        document.getElementById(
            "teacherTable"
        );


    if(!table){

        return;

    }


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                style="
                    text-align:center;
                    padding:20px;
                "
            >

                Loading teachers...

            </td>

        </tr>

    `;


    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "teachers"
                )
            );


        table.innerHTML = "";


        if(
            snapshot.empty
        ){

            table.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            padding:20px;
                        "
                    >

                        No teachers added yet.

                    </td>

                </tr>

            `;

            return;

        }


        snapshot.forEach(
            teacherDoc => {

                const data =
                    teacherDoc.data();


                table.innerHTML += `

                    <tr>

                        <td>

                            ${escapeHTML(
                                data.name ||
                                ""
                            )}

                        </td>


                        <td>

                            <strong>

                                ${escapeHTML(
                                    data.teacherId ||
                                    ""
                                )}

                            </strong>

                        </td>


                        <td>

                            <code>

                                ${escapeHTML(
                                    data.password ||
                                    ""
                                )}

                            </code>

                        </td>


                        <td>

                            ${
                                data.status ||
                                "Active"
                            }

                        </td>


                        <td>

                            <button
                                onclick="
                                    deleteTeacher(
                                        '${teacherDoc.id}'
                                    )
                                "
                            >

                                🗑 Delete

                            </button>

                        </td>

                    </tr>

                `;

            }
        );

    }

    catch(error){

        console.error(
            "Teacher loading error:",
            error
        );


        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        color:#dc2626;
                        padding:20px;
                    "
                >

                    ❌ Unable to load teachers.

                </td>

            </tr>

        `;

    }

}


/* =====================================================
   DELETE TEACHER
===================================================== */

window.deleteTeacher =
    async function(id){

        const ok =
            confirm(
                "Delete this teacher account?"
            );


        if(!ok){

            return;

        }


        try{

            await deleteDoc(
                doc(
                    db,
                    "teachers",
                    id
                )
            );


            alert(
                "Teacher account deleted."
            );


            await showTeachers();

        }

        catch(error){

            console.error(
                error
            );


            alert(
                "Unable to delete teacher.\n\n" +
                error.message
            );

        }

    };


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value){

    return String(
        value || ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}