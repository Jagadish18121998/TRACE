import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


export async function loadDashboard() {

    /* ===========================
       SHOW DASHBOARD
    =========================== */

    document.getElementById("summarySection").style.display = "grid";

    document.getElementById("dashboardHome").style.display = "grid";


    const content =
        document.getElementById("content");

    content.innerHTML = "";

    content.style.display = "none";


    /* ===========================
       PAGE HEADING
    =========================== */

    const heading =
        document.querySelector(".topbar h1");

    const subtitle =
        document.querySelector(".topbar p");


    if (heading) {

        heading.textContent =
            "Admin Dashboard";

    }


    if (subtitle) {

        subtitle.textContent =
            "Welcome back! Here's what's happening with TRACE.";

    }


    /* ===========================
       LOAD FIREBASE COUNTS
    =========================== */

    try {

        /* Students */

        const studentsSnapshot =
            await getDocs(
                collection(db, "students")
            );


        document.getElementById(
            "totalStudents"
        ).innerText =
            studentsSnapshot.size;


        /* Teachers */

        const teachersSnapshot =
            await getDocs(
                collection(db, "teachers")
            );


        document.getElementById(
            "totalTeachers"
        ).innerText =
            teachersSnapshot.size;


        /* Classes */

        const classesSnapshot =
            await getDocs(
                collection(db, "classes")
            );


        document.getElementById(
            "totalClasses"
        ).innerText =
            classesSnapshot.size;


        /* Passages */

        const passagesSnapshot =
            await getDocs(
                collection(db, "passages")
            );


        document.getElementById(
            "totalPassages"
        ).innerText =
            passagesSnapshot.size;


        console.log(
            "✅ Dashboard statistics loaded"
        );

    }


    catch(error) {

        console.error(
            "❌ Dashboard statistics error:",
            error
        );


        /*
           If a collection does not exist,
           show 0 instead of breaking
           the entire dashboard.
        */

        document.getElementById(
            "totalStudents"
        ).innerText = "0";


        document.getElementById(
            "totalTeachers"
        ).innerText = "0";


        document.getElementById(
            "totalClasses"
        ).innerText = "0";


        document.getElementById(
            "totalPassages"
        ).innerText = "0";

    }

}