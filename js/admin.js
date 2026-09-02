import { loadDashboard } from "./dashboard.js";
import { loadClasses } from "./classes.js";
import { loadTeachers } from "./teachers.js";
import { loadTeacherAssignments } from "./teacherAssignments.js";
import { loadStudents } from "./students.js";
import { loadPassages } from "./passages.js";
import { loadAssignments } from "./assignments.js";
import { loadReports } from "./reports.js";

/* -----------------------------
   Set Active Menu
------------------------------ */

function setActive(buttonId) {

    document
        .querySelectorAll(".menu button")
        .forEach(btn => btn.classList.remove("active"));

    const btn = document.getElementById(buttonId);

    if (btn) {
        btn.classList.add("active");
    }

}

/* -----------------------------
   Dashboard
------------------------------ */

document
    .getElementById("dashboardBtn")
    ?.addEventListener("click", () => {

        setActive("dashboardBtn");

        loadDashboard();

    });

/* -----------------------------
   Classes
------------------------------ */

document
    .getElementById("classesBtn")
    ?.addEventListener("click", () => {

        setActive("classesBtn");

        loadClasses();

    });

/* -----------------------------
   Teachers
------------------------------ */

document
    .getElementById("teachersBtn")
    ?.addEventListener("click", () => {

        setActive("teachersBtn");

        loadTeachers();

    });

/* -----------------------------
   Teacher Assignment
------------------------------ */

document
    .getElementById("teacherAssignmentsBtn")
    ?.addEventListener("click", () => {

        setActive("teacherAssignmentsBtn");

        loadTeacherAssignments();

    });

/* -----------------------------
   Students
------------------------------ */

document
    .getElementById("studentsBtn")
    ?.addEventListener("click", () => {

        setActive("studentsBtn");

        loadStudents();

    });

/* -----------------------------
   Passages
------------------------------ */

document
    .getElementById("passagesBtn")
    ?.addEventListener("click", () => {

        setActive("passagesBtn");

        loadPassages();

    });

/* -----------------------------
   Assign Passages
------------------------------ */

document
    .getElementById("assignPassagesBtn")
    ?.addEventListener("click", () => {

        setActive("assignPassagesBtn");

        loadAssignments();

    });

/* -----------------------------
   Reports
------------------------------ */

document
    .getElementById("reportsBtn")
    ?.addEventListener("click", () => {

        setActive("reportsBtn");

        loadReports();

    });

/* -----------------------------
   Logout
------------------------------ */

document
    .getElementById("logoutBtn")
    ?.addEventListener("click", () => {

        if (confirm("Do you want to logout?")) {

            window.location.href = "../admin.html";

        }

    });

/* -----------------------------
   Quick Buttons
------------------------------ */

document
    .getElementById("quickClass")
    ?.addEventListener("click", loadClasses);

document
    .getElementById("quickTeacher")
    ?.addEventListener("click", loadTeachers);

document
    .getElementById("quickStudent")
    ?.addEventListener("click", loadStudents);

document
    .getElementById("quickPassage")
    ?.addEventListener("click", loadPassages);

/* -----------------------------
   Today's Date
------------------------------ */

const today = new Date();

const options = {

    weekday: "long",

    year: "numeric",

    month: "long",

    day: "numeric"

};

const dateBox = document.getElementById("todayDate");

if (dateBox) {

    dateBox.innerHTML = today.toLocaleDateString("en-IN", options);

}

/* -----------------------------
   Default Page
------------------------------ */

loadDashboard();

setActive("dashboardBtn");