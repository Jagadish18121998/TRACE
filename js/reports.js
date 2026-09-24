import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   LOAD REPORTS
===================================================== */

export async function loadReports() {

    /* Hide dashboard */

    document.getElementById("summarySection").style.display =
        "none";

    document.getElementById("dashboardHome").style.display =
        "none";


    /* Heading */

    document.querySelector(".topbar h1").textContent =
        "Reports";

    document.querySelector(".topbar p").textContent =
        "View TRACE reading assessment progress and completion reports.";


    /* Show content */

    const content =
        document.getElementById("content");

    content.style.display =
        "block";


    content.innerHTML = `

        <!-- ==========================================
             REPORT HEADER
        =========================================== -->

        <div class="panel">

            <h1>📊 TRACE Reports</h1>

            <p>
                Reading assessment progress across
                students, classes and sections.
            </p>


            <!-- ======================================
                 SUMMARY CARDS
            ======================================= -->

            <div class="cards">

                <div class="card">

                    <h2 id="reportStudents">
                        0
                    </h2>

                    <p>
                        👥 Total Students
                    </p>

                </div>


                <div class="card">

                    <h2 id="reportAssignments">
                        0
                    </h2>

                    <p>
                        📖 Assigned Passages
                    </p>

                </div>


                <div class="card">

                    <h2 id="reportCompleted">
                        0
                    </h2>

                    <p>
                        ✅ Completed Assessments
                    </p>

                </div>


                <div class="card">

                    <h2 id="reportPending">
                        0
                    </h2>

                    <p>
                        ⏳ Pending Assessments
                    </p>

                </div>


                <div class="card">

                    <h2 id="reportCompletion">
                        0%
                    </h2>

                    <p>
                        📈 Completion Rate
                    </p>

                </div>

            </div>

        </div>


        <!-- ==========================================
             CLASS REPORT
        =========================================== -->

        <div class="panel">

            <h2>
                🎓 Class-wise Reading Report
            </h2>

            <br>


            <div style="
                overflow-x:auto;
            ">

                <table class="class-table">

                    <thead>

                        <tr>

                            <th>Class</th>

                            <th>Students</th>

                            <th>Assigned</th>

                            <th>Completed</th>

                            <th>Pending</th>

                            <th>Completion %</th>

                        </tr>

                    </thead>


                    <tbody id="classReportTable">

                        <tr>

                            <td
                                colspan="6"
                                style="
                                text-align:center;
                                padding:20px;
                                "
                            >

                                Loading report...

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>


        <!-- ==========================================
             SECTION REPORT
        =========================================== -->

        <div class="panel">

            <h2>
                🏷️ Section-wise Reading Report
            </h2>

            <br>


            <div style="
                overflow-x:auto;
            ">

                <table class="class-table">

                    <thead>

                        <tr>

                            <th>Class</th>

                            <th>Section</th>

                            <th>Students</th>

                            <th>Assigned</th>

                            <th>Completed</th>

                            <th>Pending</th>

                            <th>Completion %</th>

                        </tr>

                    </thead>


                    <tbody id="sectionReportTable">

                    </tbody>

                </table>

            </div>

        </div>


        <!-- ==========================================
             RECENT SUBMISSIONS
        =========================================== -->

        <div class="panel">

            <h2>
                📋 Recent Reading Submissions
            </h2>

            <br>


            <div style="
                overflow-x:auto;
            ">

                <table class="class-table">

                    <thead>

                        <tr>

                            <th>Student</th>

                            <th>Class</th>

                            <th>Section</th>

                            <th>Passage</th>

                            <th>Status</th>

                        </tr>

                    </thead>


                    <tbody id="submissionReportTable">

                    </tbody>

                </table>

            </div>

        </div>

    `;


   await generateReports();

await loadStudentReportSelector();

}


/* =====================================================
   GENERATE REPORTS
===================================================== */

async function generateReports(){

    try {

        /* ==========================================
           LOAD COLLECTIONS
        =========================================== */

        const studentsSnapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );


        const assignmentsSnapshot =
            await getDocs(
                collection(
                    db,
                    "assignments"
                )
            );


        const submissionsSnapshot =
            await getDocs(
                collection(
                    db,
                    "submissions"
                )
            );


        /* ==========================================
           CONVERT TO ARRAYS
        =========================================== */

        const students =
            studentsSnapshot.docs.map(
                studentDoc => ({
                    id: studentDoc.id,
                    ...studentDoc.data()
                })
            );


        const assignments =
            assignmentsSnapshot.docs.map(
                assignmentDoc => ({
                    id: assignmentDoc.id,
                    ...assignmentDoc.data()
                })
            );


        const submissions =
            submissionsSnapshot.docs.map(
                submissionDoc => ({
                    id: submissionDoc.id,
                    ...submissionDoc.data()
                })
            );


        /* ==========================================
           SUMMARY
        =========================================== */

        const totalStudents =
            students.length;


        const totalAssignments =
            assignments.filter(
                assignment =>
                    assignment.active !== false
            ).length;


        const totalCompleted =
            submissions.length;


        /*
           At this stage each submission represents
           a completed assessment.
        */

        const totalPossible =
            totalStudents *
            totalAssignments;


        const totalPending =
            Math.max(
                totalPossible -
                totalCompleted,
                0
            );


        const completionRate =
            totalPossible > 0
                ? Math.round(
                    (
                        totalCompleted /
                        totalPossible
                    ) * 100
                )
                : 0;


        /* ==========================================
           DISPLAY SUMMARY
        =========================================== */

        document.getElementById(
            "reportStudents"
        ).innerText =
            totalStudents;


        document.getElementById(
            "reportAssignments"
        ).innerText =
            totalAssignments;


        document.getElementById(
            "reportCompleted"
        ).innerText =
            totalCompleted;


        document.getElementById(
            "reportPending"
        ).innerText =
            totalPending;


        document.getElementById(
            "reportCompletion"
        ).innerText =
            completionRate + "%";


        /* ==========================================
           CLASS REPORT
        =========================================== */

        generateClassReport(
            students,
            assignments,
            submissions
        );


        /* ==========================================
           SECTION REPORT
        =========================================== */

        generateSectionReport(
            students,
            assignments,
            submissions
        );


        /* ==========================================
           SUBMISSION REPORT
        =========================================== */

        generateSubmissionReport(
            submissions,
            students
        );

    }


    catch(error){

        console.error(
            "Reports error:",
            error
        );


        alert(
            "Unable to load reports.\n\n" +
            error.message
        );

    }

}


/* =====================================================
   CLASS REPORT
===================================================== */

function generateClassReport(
    students,
    assignments,
    submissions
){

    const table =
        document.getElementById(
            "classReportTable"
        );


    table.innerHTML = "";


    const classes =
        [...new Set(
            students.map(
                student =>
                    String(
                        student.class || ""
                    ).trim()
            )
        )]
        .filter(Boolean)
        .sort();


    if(classes.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                    text-align:center;
                    padding:20px;
                    "
                >

                    📭 No student data available.

                </td>

            </tr>

        `;

        return;

    }


    classes.forEach(
        studentClass => {

            const classStudents =
                students.filter(
                    student =>
                        String(
                            student.class || ""
                        ).trim() ===
                        studentClass
                );


            const classAssignments =
                assignments.filter(
                    assignment =>
                        String(
                            assignment.class || ""
                        ).trim() ===
                        studentClass &&
                        assignment.active !== false
                );


            const studentIds =
                new Set(
                    classStudents.map(
                        student =>
                            student.id
                    )
                );


            const completed =
                submissions.filter(
                    submission => {

                        /*
                           Match by studentId
                           where available.
                        */

                        return studentIds.has(
                            submission.studentId
                        );

                    }
                ).length;


            const possible =
                classStudents.length *
                classAssignments.length;


            const pending =
                Math.max(
                    possible -
                    completed,
                    0
                );


            const percentage =
                possible > 0
                    ? Math.round(
                        (
                            completed /
                            possible
                        ) * 100
                    )
                    : 0;


            table.innerHTML += `

                <tr>

                    <td>
                        <b>
                            ${studentClass}
                        </b>
                    </td>

                    <td>
                        ${classStudents.length}
                    </td>

                    <td>
                        ${classAssignments.length}
                    </td>

                    <td>
                        ${completed}
                    </td>

                    <td>
                        ${pending}
                    </td>

                    <td>
                        ${percentage}%
                    </td>

                </tr>

            `;

        }
    );

}


/* =====================================================
   SECTION REPORT
===================================================== */

function generateSectionReport(
    students,
    assignments,
    submissions
){

    const table =
        document.getElementById(
            "sectionReportTable"
        );


    table.innerHTML = "";


    const groups = {};


    students.forEach(
        student => {

            const studentClass =
                String(
                    student.class || ""
                ).trim();


            const section =
                String(
                    student.section || ""
                )
                .trim()
                .toUpperCase();


            if(
                !studentClass ||
                !section
            )
                return;


            const key =
                studentClass +
                "_" +
                section;


            if(!groups[key]){

                groups[key] = {

                    class:
                        studentClass,

                    section:
                        section,

                    students: []

                };

            }


            groups[key]
                .students
                .push(student);

        }
    );


    const groupList =
        Object.values(
            groups
        );


    if(groupList.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                    text-align:center;
                    padding:20px;
                    "
                >

                    📭 No section data available.

                </td>

            </tr>

        `;

        return;

    }


    groupList.forEach(
        group => {

            const sectionStudents =
                group.students;


            const sectionAssignments =
                assignments.filter(
                    assignment =>

                        String(
                            assignment.class || ""
                        ).trim() ===
                        group.class &&

                        String(
                            assignment.section || ""
                        )
                        .trim()
                        .toUpperCase() ===
                        group.section &&

                        assignment.active !== false
                );


            const studentIds =
                new Set(
                    sectionStudents.map(
                        student =>
                            student.id
                    )
                );


            const completed =
                submissions.filter(
                    submission =>
                        studentIds.has(
                            submission.studentId
                        )
                ).length;


            const possible =
                sectionStudents.length *
                sectionAssignments.length;


            const pending =
                Math.max(
                    possible -
                    completed,
                    0
                );


            const percentage =
                possible > 0
                    ? Math.round(
                        (
                            completed /
                            possible
                        ) * 100
                    )
                    : 0;


            table.innerHTML += `

                <tr>

                    <td>
                        ${group.class}
                    </td>

                    <td>
                        ${group.section}
                    </td>

                    <td>
                        ${sectionStudents.length}
                    </td>

                    <td>
                        ${sectionAssignments.length}
                    </td>

                    <td>
                        ${completed}
                    </td>

                    <td>
                        ${pending}
                    </td>

                    <td>
                        ${percentage}%
                    </td>

                </tr>

            `;

        }
    );

}


/* =====================================================
   SUBMISSION REPORT
===================================================== */

function generateSubmissionReport(
    submissions,
    students
){

    const table =
        document.getElementById(
            "submissionReportTable"
        );


    table.innerHTML = "";


    if(submissions.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                    text-align:center;
                    padding:20px;
                    "
                >

                    📭 No submissions yet.

                </td>

            </tr>

        `;

        return;

    }


    submissions
        .slice()
        .reverse()
        .forEach(
            submission => {

                const student =
                    students.find(
                        item =>
                            item.id ===
                            submission.studentId
                    );


                table.innerHTML += `

                    <tr>

                        <td>

                            ${
                                student?.name ||
                                submission.studentName ||
                                "Unknown"
                            }

                        </td>

                        <td>

                            ${
                                student?.class ||
                                submission.class ||
                                ""
                            }

                        </td>

                        <td>

                            ${
                                student?.section ||
                                submission.section ||
                                ""
                            }

                        </td>

                        <td>

                            ${
                                submission.passageTitle ||
                                submission.title ||
                                "Reading Passage"
                            }

                        </td>

                        <td>

                            <span
                                style="
                                color:#16a34a;
                                font-weight:600;
                                "
                            >

                                ✅ Completed

                            </span>

                        </td>

                    </tr>

                `;

            }
        );

}
/* =====================================================
   STUDENT REPORT CARD SELECTOR
===================================================== */
/* =====================================================
   STUDENT REPORT CARD
===================================================== */

let reportStudents = [];


/* =====================================================
   LOAD REPORT SELECTOR
===================================================== */

async function loadStudentReportSelector(){

    const content =
        document.getElementById("content");


    const reportPanel =
        document.createElement("div");


    reportPanel.className =
        "panel";


    reportPanel.innerHTML = `

        <h2>👤 Individual Student Report Card</h2>

        <p>
            Select a class, section and student
            to generate the reading report.
        </p>


        <div class="form-box">

            <select id="reportClassSelect">

                <option value="">
                    Select Class
                </option>

            </select>


            <select id="reportSectionSelect">

                <option value="">
                    Select Section
                </option>

            </select>


            <select id="reportStudentSelect">

                <option value="">
                    Select Student
                </option>

            </select>


            <button id="generateStudentReportBtn">

                📋 Generate Report Card

            </button>

        </div>


        <div id="studentReportResult"></div>

    `;


    content.appendChild(
        reportPanel
    );


    /* Load students once */

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );


        reportStudents =
            snapshot.docs.map(
                studentDoc => ({

                    id:
                        studentDoc.id,

                    ...studentDoc.data()

                })
            );


        populateReportClasses();


    }

    catch(error){

        console.error(
            "Unable to load report students:",
            error
        );

        alert(
            "Unable to load students.\n\n" +
            error.message
        );

        return;

    }


    document
        .getElementById(
            "reportClassSelect"
        )
        .addEventListener(
            "change",
            loadReportSections
        );


    document
        .getElementById(
            "reportSectionSelect"
        )
        .addEventListener(
            "change",
            loadReportStudents
        );


    document
        .getElementById(
            "generateStudentReportBtn"
        )
        .addEventListener(
            "click",
            generateStudentReport
        );

}


/* =====================================================
   LOAD CLASSES
===================================================== */

function populateReportClasses(){

    const select =
        document.getElementById(
            "reportClassSelect"
        );


    select.innerHTML = `

        <option value="">
            Select Class
        </option>

    `;


    const classes =
        [
            ...new Set(

                reportStudents

                    .map(
                        student =>
                            String(
                                student.class ??
                                ""
                            ).trim()
                    )

                    .filter(Boolean)

            )
        ];


    classes
        .sort(
            (a,b) =>
                Number(a) -
                Number(b)
        )
        .forEach(
            className => {

                select.innerHTML += `

                    <option value="${className}">
                        Class ${className}
                    </option>

                `;

            }
        );

}


/* =====================================================
   LOAD SECTIONS
===================================================== */

function loadReportSections(){

    const classValue =
        document.getElementById(
            "reportClassSelect"
        ).value;


    const sectionSelect =
        document.getElementById(
            "reportSectionSelect"
        );


    const studentSelect =
        document.getElementById(
            "reportStudentSelect"
        );


    sectionSelect.innerHTML = `

        <option value="">
            Select Section
        </option>

    `;


    studentSelect.innerHTML = `

        <option value="">
            Select Student
        </option>

    `;


    if(!classValue){

        return;

    }


    const sections =
        [
            ...new Set(

                reportStudents

                    .filter(
                        student =>
                            String(
                                student.class ??
                                ""
                            ).trim() ===
                            classValue
                    )

                    .map(
                        student =>
                            String(
                                student.section ??
                                ""
                            )
                            .trim()
                            .toUpperCase()
                    )

                    .filter(Boolean)

            )
        ];


    sections
        .sort()
        .forEach(
            section => {

                sectionSelect.innerHTML += `

                    <option value="${section}">
                        Section ${section}
                    </option>

                `;

            }
        );

}


/* =====================================================
   LOAD STUDENTS
===================================================== */

function loadReportStudents(){

    const classValue =
        document.getElementById(
            "reportClassSelect"
        ).value;


    const sectionValue =
        document.getElementById(
            "reportSectionSelect"
        ).value;


    const studentSelect =
        document.getElementById(
            "reportStudentSelect"
        );


    studentSelect.innerHTML = `

        <option value="">
            Select Student
        </option>

    `;


    if(
        !classValue ||
        !sectionValue
    ){

        return;

    }


    const students =
        reportStudents

            .filter(
                student =>

                    String(
                        student.class ??
                        ""
                    ).trim() ===
                    classValue

                    &&

                    String(
                        student.section ??
                        ""
                    )
                    .trim()
                    .toUpperCase() ===
                    sectionValue

            );


    students
        .sort(
            (a,b) =>
                Number(
                    a.rollNo || 0
                ) -
                Number(
                    b.rollNo || 0
                )
        )
        .forEach(
            student => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    student.id;


                option.textContent =

                    `${student.rollNo || ""} - ${
                        student.name ||
                        "Student"
                    }`;


                studentSelect.appendChild(
                    option
                );

            }
        );


    if(
        students.length === 0
    ){

        studentSelect.innerHTML = `

            <option value="">
                No students found
            </option>

        `;

    }

}


/* =====================================================
   GENERATE STUDENT REPORT
===================================================== */

async function generateStudentReport(){

    const studentId =
        document.getElementById(
            "reportStudentSelect"
        ).value;


    const result =
        document.getElementById(
            "studentReportResult"
        );


    if(!studentId){

        alert(
            "Please select a student."
        );

        return;

    }


    const student =
        reportStudents.find(
            item =>
                item.id ===
                studentId
        );


    if(!student){

        alert(
            "Student record could not be found."
        );

        return;

    }


    result.innerHTML = `

        <div style="
            text-align:center;
            padding:25px;
        ">

            ⏳ Loading student report...

        </div>

    `;


    try{

        const submissionsSnapshot =
            await getDocs(
                collection(
                    db,
                    "submissions"
                )
            );


        const submissions =
    submissionsSnapshot.docs

        .map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        )

        .filter(
            submission => {

                const sameStudentId =
                    String(
                        submission.studentId || ""
                    ) ===
                    String(
                        student.id || ""
                    );


                const sameAdmissionNo =
                    String(
                        submission.studentId || ""
                    ) ===
                    String(
                        student.admissionNo || ""
                    );


                const sameLoginId =
                    String(
                        submission.studentId || ""
                    ) ===
                    String(
                        student.loginId || ""
                    );


                const sameName =
                    String(
                        submission.studentName || ""
                    )
                    .trim()
                    .toLowerCase() ===

                    String(
                        student.name || ""
                    )
                    .trim()
                    .toLowerCase();


                const sameClass =
                    String(
                        submission.class || ""
                    ) ===
                    String(
                        student.class || ""
                    );


                const sameSection =
                    String(
                        submission.section || ""
                    )
                    .trim()
                    .toUpperCase() ===

                    String(
                        student.section || ""
                    )
                    .trim()
                    .toUpperCase();


                const sameStudentByDetails =
                    sameName &&
                    sameClass &&
                    sameSection;


                return (
                    sameStudentId ||
                    sameAdmissionNo ||
                    sameLoginId ||
                    sameStudentByDetails
                );

            }
        );


        displayStudentReport(
            student,
            submissions
        );

    }

    catch(error){

        console.error(
            "Student report error:",
            error
        );


        result.innerHTML = `

            <div class="error">

                ❌ Unable to generate report.

                <br><br>

                ${error.message}

            </div>

        `;

    }

}


/* =====================================================
   DISPLAY STUDENT REPORT
   MULTI-PASSAGE REPORT SYSTEM
===================================================== */

async function displayStudentReport(
    student,
    submissions
){

    const result =
        document.getElementById(
            "studentReportResult"
        );


    if(!submissions.length){

        result.innerHTML = `

            <div class="panel">

                <h3>
                    📋 ${escapeHTML(student.name || "Student")}
                </h3>

                <p>
                    No completed reading assessment
                    is available for this student yet.
                </p>

            </div>

        `;

        return;

    }


    /* =================================================
       GET ALL PASSAGES
    ================================================= */

    const passageSnapshot =
        await getDocs(
            collection(
                db,
                "passages"
            )
        );


    const passageMap = new Map();


    passageSnapshot.docs.forEach(
        passageDoc => {

            passageMap.set(
                passageDoc.id,
                {
                    id:
                        passageDoc.id,

                    ...passageDoc.data()
                }
            );

        }
    );


    /* =================================================
       SORT SUBMISSIONS
       NEWEST FIRST
    ================================================= */

    const sortedSubmissions =
        submissions
            .slice()
            .sort(
                (a,b) => {

                    const aTime =
                        a.submittedAt &&
                        typeof a.submittedAt.toMillis === "function"
                            ? a.submittedAt.toMillis()
                            : 0;

                    const bTime =
                        b.submittedAt &&
                        typeof b.submittedAt.toMillis === "function"
                            ? b.submittedAt.toMillis()
                            : 0;

                    return bTime - aTime;

                }
            );


    /* =================================================
       KEEP ONE LATEST ATTEMPT PER PASSAGE
    ================================================= */

    const passageSubmissions =
        new Map();


    sortedSubmissions.forEach(
        submission => {

            const passageId =
                String(
                    submission.passageId || ""
                ).trim();


            if(
                passageId &&
                !passageSubmissions.has(
                    passageId
                )
            ){

                passageSubmissions.set(
                    passageId,
                    submission
                );

            }

        }
    );


    const reportSubmissions =
        Array.from(
            passageSubmissions.values()
        );


    /* =================================================
       REPORT HEADER
    ================================================= */

    result.innerHTML = `

        <div class="panel">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                flex-wrap:wrap;
            ">

                <div>

                    <h2>
                        📋 TRACE Reading Assessment
                    </h2>

                    <p>
                        Individual Student Report Card
                    </p>

                </div>


                <button
                    onclick="window.print()"
                    style="
                        padding:10px 16px;
                        border:none;
                        border-radius:10px;
                        cursor:pointer;
                        font-weight:600;
                    "
                >
                    🖨 Print Report
                </button>

            </div>


            <hr style="margin:20px 0;">


            <!-- STUDENT INFORMATION -->

            <h3>
                👤 Student Information
            </h3>


            <div class="cards"
                 style="margin-top:15px;">

                <div class="card">

                    <h2>
                        ${escapeHTML(
                            student.name || "-"
                        )}
                    </h2>

                    <p>
                        Student Name
                    </p>

                </div>


                <div class="card">

                    <h2>
                        ${escapeHTML(
                            student.admissionNo || "-"
                        )}
                    </h2>

                    <p>
                        Admission No.
                    </p>

                </div>


                <div class="card">

                    <h2>
                        ${escapeHTML(
                            `${student.class || "-"} ${student.section || ""}`
                        )}
                    </h2>

                    <p>
                        Class / Section
                    </p>

                </div>


                <div class="card">

                    <h2>
                        ${reportSubmissions.length}
                    </h2>

                    <p>
                        Passages Attempted
                    </p>

                </div>

            </div>


            <!-- PASSAGE REPORTS -->

            <div id="passageReportsContainer"
                 style="margin-top:30px;">

            </div>

        </div>

    `;


    const container =
        document.getElementById(
            "passageReportsContainer"
        );


    /* =================================================
       GENERATE EACH PASSAGE REPORT
    ================================================= */

    for(
        let index = 0;
        index < reportSubmissions.length;
        index++
    ){

        const submission =
            reportSubmissions[index];


        const passage =
            passageMap.get(
                submission.passageId
            );


        if(!passage){

            container.innerHTML += `

                <div class="panel"
                     style="
                        margin-top:20px;
                        border-left:5px solid #dc2626;
                     ">

                    <h3>
                        📖 Passage ${index + 1}
                    </h3>

                    <p>
                        Original passage could not be found.
                    </p>

                </div>

            `;

            continue;

        }


        /* =============================================
           COMBINE SLIDE 1 + SLIDE 2
        ============================================= */

        let originalText = "";


        if(
            passage.slide1 ||
            passage.slide2
        ){

            originalText =
                [
                    passage.slide1,
                    passage.slide2
                ]
                .filter(
                    text =>
                        String(
                            text || ""
                        ).trim()
                )
                .join(" ");

        }

        else{

            originalText =
                String(
                    passage.text || ""
                ).trim();

        }


        /* =============================================
           GET STUDENT TRANSCRIPT
        ============================================= */

        let transcript =
            String(
                submission.transcript || ""
            ).trim();


        /*
           New submissions contain slideTranscripts.
           Use them when available because they preserve
           Slide 1 and Slide 2 separately.
        */

        if(
            Array.isArray(
                submission.slideTranscripts
            )
        ){

            transcript =
                submission.slideTranscripts
                    .filter(
                        text =>
                            String(
                                text || ""
                            ).trim()
                    )
                    .join(" ")
                    .trim();

        }


        /* =============================================
           READING TIME
        ============================================= */

        let readingTime = 0;


        if(
            Array.isArray(
                submission.slideReadingTimes
            )
        ){

            readingTime =
                submission.slideReadingTimes
                    .reduce(
                        (
                            total,
                            value
                        ) =>
                            total +
                            Number(
                                value || 0
                            ),
                        0
                    );

        }


        if(
            readingTime <= 0
        ){

            readingTime =
                Number(
                    submission.readingTime || 0
                );

        }


        /* =============================================
           ANALYSE THIS PASSAGE
        ============================================= */

        const analysis =
            analyseReading(
                originalText,
                transcript,
                readingTime
            );


        /* =============================================
           CREATE PASSAGE SECTION
        ============================================= */

        const passageBox =
            document.createElement(
                "div"
            );


        passageBox.className =
            "panel";


        passageBox.style.marginTop =
            "25px";


        passageBox.innerHTML =
            renderPassageReport(
                index + 1,
                passage,
                submission,
                originalText,
                transcript,
                analysis
            );


        container.appendChild(
            passageBox
        );

    }

}


/* =====================================================
   ANALYSE READING
   ALWAYS CALCULATE FROM THIS PASSAGE + TRANSCRIPT
===================================================== */

function analyseReading(
    originalText,
    transcript,
    readingTime
){

    const expectedWords =
        reportWords(
            originalText
        );


    const spokenWords =
        reportWords(
            transcript
        );


    const alignment =
        alignReading(
            expectedWords,
            spokenWords
        );


    const correct =
        alignment.filter(
            item =>
                item.type === "correct"
        ).length;


    const substitutions =
        alignment.filter(
            item =>
                item.type === "substitution"
        );


    const omissions =
        alignment.filter(
            item =>
                item.type === "omission"
        );


    const errors =
        substitutions.length +
        omissions.length;


    const seconds =
        Math.max(
            1,
            Number(
                readingTime || 0
            )
        );


    const wcpm =
        Math.round(
            correct *
            (
                60 /
                seconds
            )
        );


    const fluencyPercent =
        expectedWords.length > 0

            ? Math.round(
                (
                    correct /
                    expectedWords.length
                ) * 100
            )

            : 0;


    return {

        expectedWords,

        spokenWords,

        alignment,

        correct,

        errors,

        omissions,

        substitutions,

        wcpm,

        fluencyPercent,

        seconds

    };

}


/* =====================================================
   WORD NORMALISATION
===================================================== */

function reportWords(text){

    return String(
        text || ""
    )

        .toLowerCase()

        .replace(
            /[“”‘’]/g,
            "'"
        )

        .replace(
            /[.,!?;:()[\]{}"“”‘’]/g,
            " "
        )

        .replace(
            /[^\p{L}\p{N}'-]+/gu,
            " "
        )

        .split(
            /\s+/
        )

        .filter(Boolean);

}


/* =====================================================
   WORD ALIGNMENT
===================================================== */

function alignReading(
    expectedWords,
    spokenWords
){

    const result = [];


    let i = 0;

    let j = 0;


    while(
        i <
        expectedWords.length
    ){

        const expected =
            expectedWords[i];


        const spoken =
            spokenWords[j];


        /* =========================================
           CORRECT
        ========================================= */

        if(
            spoken &&
            expected === spoken
        ){

            result.push({

                expected,

                spoken,

                type:
                    "correct"

            });


            i++;

            j++;

            continue;

        }


        /* =========================================
           OMITTED WORD
        ========================================= */

        if(
            spoken &&
            expectedWords[
                i + 1
            ] === spoken
        ){

            result.push({

                expected,

                spoken:
                    "",

                type:
                    "omission"

            });


            i++;

            continue;

        }


        /* =========================================
           EXTRA SPOKEN WORD
        ========================================= */

        if(
            spoken &&
            spokenWords[
                j + 1
            ] === expected
        ){

            j++;

            continue;

        }


        /* =========================================
           INCORRECT / SUBSTITUTION
        ========================================= */

        if(spoken){

            result.push({

                expected,

                spoken,

                type:
                    "substitution"

            });


            i++;

            j++;

            continue;

        }


        /* =========================================
           END OF SPEECH = OMITTED
        ========================================= */

        result.push({

            expected,

            spoken:
                "",

            type:
                "omission"

        });


        i++;

    }


    return result;

}


/* =====================================================
   RENDER ONE PASSAGE REPORT
===================================================== */

function renderPassageReport(
    passageNumber,
    passage,
    submission,
    originalText,
    transcript,
    analysis
){

    const incorrectWords =
        analysis.substitutions;


    const skippedWords =
        analysis.omissions;


    const markedPassage =
        buildMarkedPassage(
            analysis.alignment
        );


    return `

        <!-- PASSAGE HEADER -->

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
        ">

            <div>

                <h2>
                    📖 Passage ${passageNumber}
                </h2>

                <h3 style="
                    margin-top:5px;
                ">

                    ${escapeHTML(
                        submission.passageTitle ||
                        passage.title ||
                        "Reading Passage"
                    )}

                </h3>

            </div>


            <div style="
                padding:8px 14px;
                background:#eff6ff;
                border-radius:20px;
                font-weight:600;
            ">

                Assessment ${passageNumber}

            </div>

        </div>


        <hr style="
            margin:18px 0;
        ">


        <!-- PERFORMANCE -->

        <h3>
            📊 Reading Performance
        </h3>


        <div class="cards"
             style="margin-top:15px;">

            <div class="card">

                <h2 style="
                    font-size:32px;
                ">

                    ${analysis.wcpm}

                </h2>

                <p>
                    WCPM
                </p>

            </div>


            <div class="card">

                <h2>

                    ${analysis.fluencyPercent}%

                </h2>

                <p>
                    Fluency / Accuracy
                </p>

            </div>


            <div class="card">

                <h2>

                    ${analysis.correct}

                </h2>

                <p>
                    Correct Words
                </p>

            </div>


            <div class="card">

                <h2>

                    ${analysis.errors}

                </h2>

                <p>
                    Total Errors
                </p>

            </div>

        </div>


        <!-- SECONDARY STATS -->

        <div style="
            display:grid;
            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(150px,1fr)
                );
            gap:12px;
            margin-top:15px;
        ">


            <div style="
                padding:15px;
                background:#f8fafc;
                border-radius:12px;
            ">

                <strong>
                    ${analysis.expectedWords.length}
                </strong>

                <br>

                Total Passage Words

            </div>


            <div style="
                padding:15px;
                background:#f8fafc;
                border-radius:12px;
            ">

                <strong>
                    ${incorrectWords.length}
                </strong>

                <br>

                Incorrect Words

            </div>


            <div style="
                padding:15px;
                background:#f8fafc;
                border-radius:12px;
            ">

                <strong>
                    ${skippedWords.length}
                </strong>

                <br>

                Skipped Words

            </div>


            <div style="
                padding:15px;
                background:#f8fafc;
                border-radius:12px;
            ">

                <strong>
                    ${analysis.seconds}s
                </strong>

                <br>

                Reading Time

            </div>

        </div>


        <!-- INCORRECT WORDS -->

        <div style="
            margin-top:25px;
        ">

            <h3>
                ❌ Incorrectly Read Words
            </h3>


            ${
                incorrectWords.length === 0

                    ? `

                        <p style="
                            margin-top:10px;
                            color:#16a34a;
                        ">

                            ✅ No incorrect word substitutions detected.

                        </p>

                    `

                    :

                    `

                        <div style="
                            margin-top:12px;
                            display:flex;
                            flex-wrap:wrap;
                            gap:10px;
                        ">

                            ${

                                incorrectWords
                                    .map(
                                        item => `

                                            <span style="
                                                padding:8px 12px;
                                                background:#fef2f2;
                                                border:1px solid #fecaca;
                                                border-radius:10px;
                                            ">

                                                <strong>
                                                    ${escapeHTML(
                                                        item.expected
                                                    )}
                                                </strong>

                                                →
                                                ${escapeHTML(
                                                    item.spoken
                                                )}

                                            </span>

                                        `
                                    )
                                    .join("")

                            }

                        </div>

                    `

            }

        </div>


        <!-- SKIPPED WORDS -->

        <div style="
            margin-top:25px;
        ">

            <h3>
                🟠 Skipped Words
            </h3>


            ${
                skippedWords.length === 0

                    ? `

                        <p style="
                            margin-top:10px;
                            color:#16a34a;
                        ">

                            ✅ No skipped words detected.

                        </p>

                    `

                    :

                    `

                        <div style="
                            margin-top:12px;
                            display:flex;
                            flex-wrap:wrap;
                            gap:8px;
                        ">

                            ${

                                skippedWords
                                    .map(
                                        item => `

                                            <span style="
                                                padding:7px 10px;
                                                background:#fff7ed;
                                                border:1px solid #fed7aa;
                                                border-radius:8px;
                                            ">

                                                ${escapeHTML(
                                                    item.expected
                                                )}

                                            </span>

                                        `
                                    )
                                    .join("")

                            }

                        </div>

                    `

            }

        </div>


        <!-- WORD LEVEL PASSAGE -->

        <div style="
            margin-top:30px;
        ">

            <h3>
                📖 Word-Level Reading Analysis
            </h3>


            <div style="
                margin-top:12px;
                padding:12px 15px;
                background:#f8fafc;
                border-radius:12px;
                font-size:14px;
            ">

                <span style="
                    text-decoration:underline;
                    text-decoration-color:#16a34a;
                    text-decoration-thickness:3px;
                ">

                    Correct

                </span>

                &nbsp;&nbsp;


                <span style="
                    text-decoration:underline;
                    text-decoration-color:#dc2626;
                    text-decoration-thickness:3px;
                ">

                    Incorrect

                </span>

                &nbsp;&nbsp;


                <span style="
                    text-decoration:underline;
                    text-decoration-color:#f97316;
                    text-decoration-thickness:3px;
                ">

                    Skipped

                </span>

            </div>


            <div style="
                margin-top:15px;
                padding:22px;
                background:#ffffff;
                border:1px solid #e2e8f0;
                border-radius:15px;
                font-size:18px;
                line-height:2;
            ">

                ${markedPassage}

            </div>

        </div>


        <!-- TRANSCRIPT -->

        <div style="
            margin-top:25px;
        ">

            <h3>
                🎙 Student Speech Transcript
            </h3>


            <div style="
                margin-top:10px;
                padding:18px;
                background:#f8fafc;
                border-radius:12px;
                line-height:1.8;
            ">

                ${
                    transcript

                        ? escapeHTML(
                            transcript
                        )

                        : `

                            <span style="
                                color:#dc2626;
                            ">

                                No speech transcript was saved for this assessment.

                            </span>

                        `
                }

            </div>

        </div>


        <!-- FOCUS -->

        <div style="
            margin-top:25px;
            padding:20px;
            background:#eff6ff;
            border-left:
                5px solid #2563eb;
            border-radius:12px;
        ">

            <h3>
                🎯 Reading Focus
            </h3>


            <p style="
                margin-top:8px;
                line-height:1.7;
            ">

                ${getReadingFocus(
                    analysis
                )}

            </p>

        </div>

    `;

}


/* =====================================================
   MARKED PASSAGE
===================================================== */

function buildMarkedPassage(
    alignment
){

    return alignment
        .map(
            item => {

                let underlineColor =
                    "#16a34a";


                if(
                    item.type ===
                    "substitution"
                ){

                    underlineColor =
                        "#dc2626";

                }


                if(
                    item.type ===
                    "omission"
                ){

                    underlineColor =
                        "#f97316";

                }


                return `

                    <span style="
                        text-decoration:underline;
                        text-decoration-color:${underlineColor};
                        text-decoration-thickness:3px;
                        text-underline-offset:4px;
                        margin-right:5px;
                    ">

                        ${escapeHTML(
                            item.expected
                        )}

                    </span>

                `;

            }
        )
        .join(" ");

}


/* =====================================================
   READING FOCUS
===================================================== */

function getReadingFocus(
    analysis
){

    if(
        analysis.fluencyPercent < 85
    ){

        return `

            Focus on
            <strong>reading accuracy</strong>.
            Read slowly and carefully, paying special
            attention to unfamiliar words.

        `;

    }


    if(
        analysis.wcpm < 90
    ){

        return `

            Focus on
            <strong>reading fluency and pace</strong>.
            Practise reading aloud regularly while maintaining
            correct pronunciation and smooth phrasing.

        `;

    }


    if(
        analysis.omissions.length >
        analysis.substitutions.length
    ){

        return `

            Focus on
            <strong>careful word-by-word reading</strong>.
            Avoid skipping words during reading practice.

        `;

    }


    if(
        analysis.substitutions.length > 3
    ){

        return `

            Focus on
            <strong>accurate word recognition</strong>.
            Practise unfamiliar vocabulary and pause briefly
            when unsure of a word.

        `;

    }


    if(
        analysis.wcpm >= 130 &&
        analysis.fluencyPercent >= 95
    ){

        return `

            Excellent reading fluency and accuracy.
            Continue developing
            <strong>expression, phrasing and appropriate pauses</strong>.

        `;

    }


    return `

        Reading is developing well.
        Continue regular read-aloud practice while maintaining
        both <strong>accuracy and a steady reading pace</strong>.

    `;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
    value
){

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