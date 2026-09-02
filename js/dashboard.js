import { loadDashboard } from "./dashboardHome.js";
import { loadClasses } from "./classes.js";
import { loadTeachers } from "./teachers.js";
import { loadTeacherAssignments } from "./teacherAssignments.js";
import { loadStudents } from "./students.js";
import { loadPassages } from "./passages.js";
import { loadAssignments } from "./assignments.js";
import { loadReports } from "./reports.js";

/* ===========================
   ACTIVE MENU
=========================== */

function setActive(id) {

    document
        .querySelectorAll(".menu button")
        .forEach(btn => btn.classList.remove("active"));

    const button = document.getElementById(id);

    if (button) {

        button.classList.add("active");

    }

}

/* ===========================
   DASHBOARD
=========================== */

document
    .getElementById("dashboardBtn")
    ?.addEventListener("click", () => {

        setActive("dashboardBtn");

        loadDashboard();

    });

/* ===========================
   CLASSES
=========================== */

document
    .getElementById("classesBtn")
    ?.addEventListener("click", () => {

        setActive("classesBtn");

        loadClasses();

    });

/* ===========================
   TEACHERS
=========================== */

document
    .getElementById("teachersBtn")
    ?.addEventListener("click", () => {

        setActive("teachersBtn");

        loadTeachers();

    });

/* ===========================
   TEACHER ASSIGNMENTS
=========================== */

document
    .getElementById("teacherAssignmentsBtn")
    ?.addEventListener("click", () => {

        setActive("teacherAssignmentsBtn");

        loadTeacherAssignments();

    });

/* ===========================
   STUDENTS
=========================== */

document
    .getElementById("studentsBtn")
    ?.addEventListener("click", () => {

        setActive("studentsBtn");

        loadStudents();

    });

/* ===========================
   PASSAGES
=========================== */

document
    .getElementById("passagesBtn")
    ?.addEventListener("click", () => {

        setActive("passagesBtn");

        loadPassages();

    });

/* ===========================
   ASSIGN PASSAGES
=========================== */

document
    .getElementById("assignPassagesBtn")
    ?.addEventListener("click", () => {

        setActive("assignPassagesBtn");

        loadAssignments();

    });

/* ===========================
   REPORTS
=========================== */

document
    .getElementById("reportsBtn")
    ?.addEventListener("click", () => {

        setActive("reportsBtn");

        loadReports();

    });

/* ===========================
   QUICK ACTIONS
=========================== */

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

/* ===========================
   LOGOUT
=========================== */

document
    .getElementById("logoutBtn")
    ?.addEventListener("click", () => {

        if (confirm("Do you really want to logout?")) {

            window.location.href = "../admin.html";

        }

    });

/* ===========================
   TODAY'S DATE
=========================== */

const todayDate = document.getElementById("todayDate");

if (todayDate) {

    const today = new Date();

    todayDate.innerHTML = today.toLocaleDateString("en-IN", {

        weekday: "long",

        year: "numeric",

        month: "long",

        day: "numeric"

    });

}

/* ===========================
   DEFAULT PAGE
=========================== */

setActive("dashboardBtn");

loadDashboard();