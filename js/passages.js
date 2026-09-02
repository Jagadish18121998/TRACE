import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   LOAD PASSAGES MODULE
===================================================== */

export async function loadPassages() {

    /* Hide dashboard */

    document.getElementById("summarySection").style.display =
        "none";

    document.getElementById("dashboardHome").style.display =
        "none";


    /* Page heading */

    document.querySelector(".topbar h1").textContent =
        "Passage Management";

    document.querySelector(".topbar p").textContent =
        "Create and manage reading passages for students.";


    /* Show content */

    const content =
        document.getElementById("content");

    content.style.display = "block";


    content.innerHTML = `

        <!-- ===============================
             CREATE PASSAGE
        ================================ -->

        <div class="panel">

            <h1>📚 Create Reading Passage</h1>

            <p>
                Create a two-slide reading passage
                and assign it to a class and section.
            </p>


            <div class="form-box">

                <input
                    id="passageTitle"
                    placeholder="Passage Title"
                >


                <select id="passageClass">

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


                <select id="passageSection">

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


                <br><br>


                <label>
                    <b>📖 Slide 1</b>
                </label>

                <textarea
                    id="slide1"
                    rows="7"
                    placeholder="Enter Slide 1 reading passage..."
                ></textarea>


                <br>


                <label>
                    <b>📖 Slide 2</b>
                </label>

                <textarea
                    id="slide2"
                    rows="7"
                    placeholder="Enter Slide 2 reading passage..."
                ></textarea>


                <br>


                <label>

                    <input
                        type="checkbox"
                        id="passageActive"
                        checked
                    >

                    Active — assign this passage to students

                </label>


                <br><br>


                <button id="savePassageBtn">

                    ➕ Save Passage

                </button>

            </div>

        </div>


        <!-- ===============================
             SAVED PASSAGES
        ================================ -->

        <div class="panel">

            <h2>📖 Saved Passages</h2>

            <br>


            <div style="
                overflow-x:auto;
            ">

                <table class="class-table">

                    <thead>

                        <tr>

                            <th>Title</th>

                            <th>Class</th>

                            <th>Section</th>

                            <th>Slide 1</th>

                            <th>Slide 2</th>

                            <th>Status</th>

                            <th>Action</th>

                        </tr>

                    </thead>


                    <tbody id="passageTable">

                    </tbody>

                </table>

            </div>

        </div>

    `;


    /* Save button */

    document
        .getElementById("savePassageBtn")
        .addEventListener(
            "click",
            savePassage
        );


    await showPassages();

}


/* =====================================================
   SAVE PASSAGE
===================================================== */

async function savePassage() {

    const title =
        document.getElementById(
            "passageTitle"
        ).value.trim();


    const studentClass =
        document.getElementById(
            "passageClass"
        ).value;


    const section =
        document.getElementById(
            "passageSection"
        ).value;


    const slide1 =
        document.getElementById(
            "slide1"
        ).value.trim();


    const slide2 =
        document.getElementById(
            "slide2"
        ).value.trim();


    const active =
        document.getElementById(
            "passageActive"
        ).checked;


    /* Validation */

    if(
        !title ||
        !studentClass ||
        !section ||
        !slide1 ||
        !slide2
    ){

        alert(
            "Please fill in all passage details."
        );

        return;

    }


    try {

        await addDoc(

            collection(
                db,
                "passages"
            ),

            {

                title:
                    title,

                class:
                    studentClass,

                section:
                    section,

                slide1:
                    slide1,

                slide2:
                    slide2,

                active:
                    active,

                createdAt:
                    serverTimestamp()

            }

        );


        alert(
            "✅ Passage created successfully!"
        );


        /* Clear form */

        document.getElementById(
            "passageTitle"
        ).value = "";


        document.getElementById(
            "passageClass"
        ).value = "";


        document.getElementById(
            "passageSection"
        ).value = "";


        document.getElementById(
            "slide1"
        ).value = "";


        document.getElementById(
            "slide2"
        ).value = "";


        document.getElementById(
            "passageActive"
        ).checked = true;


        await showPassages();

    }


    catch(error){

        console.error(
            "Save passage error:",
            error
        );


        alert(
            "❌ Unable to save passage.\n\n" +
            error.message
        );

    }

}


/* =====================================================
   SHOW PASSAGES
===================================================== */

async function showPassages() {

    const table =
        document.getElementById(
            "passageTable"
        );


    if(!table) return;


    table.innerHTML = `

        <tr>

            <td
                colspan="7"
                style="text-align:center;"
            >

                Loading passages...

            </td>

        </tr>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "passages"
                )
            );


        table.innerHTML = "";


        if(snapshot.empty){

            table.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        style="
                        text-align:center;
                        padding:25px;
                        "
                    >

                        📖 No passages created yet.

                    </td>

                </tr>

            `;

            return;

        }


        snapshot.forEach(
            passageDoc => {

                const data =
                    passageDoc.data();


                const slide1Preview =
                    String(
                        data.slide1 || ""
                    ).substring(
                        0,
                        55
                    );


                const slide2Preview =
                    String(
                        data.slide2 || ""
                    ).substring(
                        0,
                        55
                    );


                const status =
                    data.active === true
                        ? "Active"
                        : "Inactive";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        <b>
                            ${data.title || ""}
                        </b>

                    </td>


                    <td>

                        ${data.class || ""}

                    </td>


                    <td>

                        ${data.section || ""}

                    </td>


                    <td>

                        ${slide1Preview}...

                    </td>


                    <td>

                        ${slide2Preview}...

                    </td>


                    <td>

                        <span
                            style="
                            font-weight:600;
                            color:${
                                data.active === true
                                ? '#16a34a'
                                : '#dc2626'
                            };
                            "
                        >

                            ${
                                data.active === true
                                ? "🟢 Active"
                                : "🔴 Inactive"
                            }

                        </span>

                    </td>


                    <td>

                        <button
                            class="togglePassageBtn"
                        >

                            ${
                                data.active === true
                                ? "⏸ Disable"
                                : "▶ Activate"
                            }

                        </button>


                        <button
                            class="deletePassageBtn"
                            style="margin-left:5px;"
                        >

                            🗑 Delete

                        </button>

                    </td>

                `;


                /* Toggle */

                row
                    .querySelector(
                        ".togglePassageBtn"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            togglePassage(
                                passageDoc.id,
                                data.active === true
                            );

                        }
                    );


                /* Delete */

                row
                    .querySelector(
                        ".deletePassageBtn"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            deletePassage(
                                passageDoc.id
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
            "Load passages error:",
            error
        );


        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                    text-align:center;
                    color:#dc2626;
                    padding:25px;
                    "
                >

                    ❌ Unable to load passages.

                </td>

            </tr>

        `;

    }

}


/* =====================================================
   ACTIVATE / DEACTIVATE
===================================================== */

async function togglePassage(
    id,
    currentStatus
){

    try {

        await updateDoc(

            doc(
                db,
                "passages",
                id
            ),

            {

                active:
                    !currentStatus

            }

        );


        await showPassages();

    }


    catch(error){

        console.error(
            "Update passage error:",
            error
        );


        alert(
            "❌ Unable to update passage."
        );

    }

}


/* =====================================================
   DELETE PASSAGE
===================================================== */

async function deletePassage(id){

    const confirmDelete =
        confirm(
            "Delete this passage permanently?"
        );


    if(!confirmDelete) return;


    try {

        await deleteDoc(

            doc(
                db,
                "passages",
                id
            )

        );


        alert(
            "🗑 Passage deleted."
        );


        await showPassages();

    }


    catch(error){

        console.error(
            "Delete passage error:",
            error
        );


        alert(
            "❌ Unable to delete passage."
        );

    }

}