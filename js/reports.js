// ============================================================
// TRACE REPORTS
// Part 1: Imports, report layout, data loading and summaries
// ============================================================

import { db } from "../firebase/firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Shared data used by the individual student report card.
let reportStudents = [];
let reportAssignments = [];
let reportSubmissions = [];
let reportPassages = new Map();

// ============================================================
// LOAD REPORTS PAGE
// ============================================================

export async function loadReports() {
    const summarySection = document.getElementById("summarySection");
    const dashboardHome = document.getElementById("dashboardHome");
    const content = document.getElementById("content");

    if (!content) {
        console.error("TRACE reports: content container not found.");
        return;
    }

    if (summarySection) {
        summarySection.style.display = "none";
    }

    if (dashboardHome) {
        dashboardHome.style.display = "none";
    }

    const heading = document.querySelector(".topbar h1");
    const description = document.querySelector(".topbar p");

    if (heading) {
        heading.textContent = "Reports";
    }

    if (description) {
        description.textContent =
            "View TRACE reading assessment progress and completion reports.";
    }

    content.style.display = "block";

    content.innerHTML = `
        <div class="panel">
            <h1>📊 TRACE Reports</h1>
            <p>
                Reading assessment progress across students,
                classes and sections.
            </p>

            <div class="cards">
                <div class="card">
                    <h2 id="reportStudents">0</h2>
                    <p>👥 Total Students</p>
                </div>

                <div class="card">
                    <h2 id="reportAssignments">0</h2>
                    <p>📖 Assigned Passages</p>
                </div>

                <div class="card">
                    <h2 id="reportCompleted">0</h2>
                    <p>✅ Completed Assessments</p>
                </div>

                <div class="card">
                    <h2 id="reportPending">0</h2>
                    <p>⏳ Pending Assessments</p>
                </div>

                <div class="card">
                    <h2 id="reportCompletion">0%</h2>
                    <p>📈 Completion Rate</p>
                </div>
            </div>
        </div>

        <div class="panel">
            <h2>🎓 Class-wise Reading Report</h2>
            <br>

            <div style="overflow-x:auto;">
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
                            <td colspan="6" style="text-align:center;padding:20px;">
                                Loading report...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel">
            <h2>🏷️ Section-wise Reading Report</h2>
            <br>

            <div style="overflow-x:auto;">
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
                        <tr>
                            <td colspan="7" style="text-align:center;padding:20px;">
                                Loading report...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel">
            <h2>📋 Recent Reading Submissions</h2>
            <br>

            <div style="overflow-x:auto;">
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
                        <tr>
                            <td colspan="5" style="text-align:center;padding:20px;">
                                Loading submissions...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    try {
        await generateReports();
        await loadStudentReportSelector();
    } catch (error) {
        console.error("Unable to initialise TRACE reports:", error);

        content.insertAdjacentHTML(
            "beforeend",
            `<div class="panel error">
                <strong>Unable to load TRACE reports.</strong>
                <p>${escapeHTML(error.message || "Unknown error")}</p>
            </div>`
        );
    }
}

// ============================================================
// LOAD FIRESTORE DATA
// ============================================================


// ============================================================
// KEEP THE LATEST ATTEMPT FOR EACH STUDENT AND PASSAGE
// ============================================================

function getLatestStudentPassageSubmissions(submissions) {
    const latestByStudentAndPassage = new Map();

    const sorted = [...submissions].sort(
        (a, b) => getTimestamp(b.submittedAt) - getTimestamp(a.submittedAt)
    );

    for (const submission of sorted) {
        const studentId = String(submission.studentId ?? "").trim();
        const passageId = String(submission.passageId ?? "").trim();

        if (!studentId || !passageId) {
            continue;
        }

        const status = String(submission.status ?? "").toLowerCase();

        // Support both status values used by the TRACE reading pages.
        if (status && !["completed", "submitted"].includes(status)) {
            continue;
        }

        const key = `${studentId}::${passageId}`;

        if (!latestByStudentAndPassage.has(key)) {
            latestByStudentAndPassage.set(key, submission);
        }
    }

    return [...latestByStudentAndPassage.values()];
}

// ============================================================
// CLASS-WISE REPORT
// ============================================================

function generateClassReport(students, assignments, submissions) {
    const table = document.getElementById("classReportTable");

    if (!table) return;

    table.innerHTML = "";

    const classes = [
        ...new Set(
            students
                .map(student => normaliseClass(student.class))
                .filter(Boolean)
        )
    ].sort(compareClassNames);

    if (classes.length === 0) {
        table.innerHTML = emptyTableRow(
            6,
            "📭 No student data available."
        );
        return;
    }

    for (const studentClass of classes) {
        const classStudents = students.filter(
            student => normaliseClass(student.class) === studentClass
        );

        const classAssignments = assignments.filter(
            assignment =>
                normaliseClass(assignment.class) === studentClass &&
                assignment.active !== false
        );

        const classStudentIds = new Set(
            classStudents.map(student => String(student.id))
        );

        const classSubmissions = submissions.filter(
            submission =>
                classStudentIds.has(String(submission.studentId ?? "")) &&
                classAssignments.some(
                    assignment =>
                        String(assignment.id) ===
                            String(submission.assignmentId ?? "") ||
                        String(assignment.passageId ?? "") ===
                            String(submission.passageId ?? "")
                )
        );

        const possible = classStudents.length * classAssignments.length;
        const completed = Math.min(classSubmissions.length, possible);
        const pending = Math.max(possible - completed, 0);

        const percentage = possible > 0
            ? Math.round((completed / possible) * 100)
            : 0;

        table.insertAdjacentHTML(
            "beforeend",
            `
            <tr>
                <td><strong>${escapeHTML(studentClass)}</strong></td>
                <td>${classStudents.length}</td>
                <td>${possible}</td>
                <td>${completed}</td>
                <td>${pending}</td>
                <td>${percentage}%</td>
            </tr>
            `
        );
    }
}

// ============================================================
// SECTION-WISE REPORT
// ============================================================

function generateSectionReport(students, assignments, submissions) {
    const table = document.getElementById("sectionReportTable");

    if (!table) return;

    table.innerHTML = "";

    const groups = new Map();

    for (const student of students) {
        const studentClass = normaliseClass(student.class);
        const section = normaliseSection(student.section);

        if (!studentClass || !section) continue;

        const key = `${studentClass}::${section}`;

        if (!groups.has(key)) {
            groups.set(key, {
                className: studentClass,
                section,
                students: []
            });
        }

        groups.get(key).students.push(student);
    }

    const groupList = [...groups.values()].sort((a, b) => {
        const classComparison = compareClassNames(a.className, b.className);

        return classComparison !== 0
            ? classComparison
            : a.section.localeCompare(b.section);
    });

    if (groupList.length === 0) {
        table.innerHTML = emptyTableRow(
            7,
            "📭 No section data available."
        );
        return;
    }

    for (const group of groupList) {
        const sectionAssignments = assignments.filter(
            assignment =>
                normaliseClass(assignment.class) === group.className &&
                normaliseSection(assignment.section) === group.section &&
                assignment.active !== false
        );

        const sectionStudentIds = new Set(
            group.students.map(student => String(student.id))
        );

        const sectionSubmissions = submissions.filter(
            submission =>
                sectionStudentIds.has(String(submission.studentId ?? "")) &&
                sectionAssignments.some(
                    assignment =>
                        String(assignment.id) ===
                            String(submission.assignmentId ?? "") ||
                        String(assignment.passageId ?? "") ===
                            String(submission.passageId ?? "")
                )
        );

        const possible = group.students.length * sectionAssignments.length;
        const completed = Math.min(sectionSubmissions.length, possible);
        const pending = Math.max(possible - completed, 0);

        const percentage = possible > 0
            ? Math.round((completed / possible) * 100)
            : 0;

        table.insertAdjacentHTML(
            "beforeend",
            `
            <tr>
                <td>${escapeHTML(group.className)}</td>
                <td>${escapeHTML(group.section)}</td>
                <td>${group.students.length}</td>
                <td>${possible}</td>
                <td>${completed}</td>
                <td>${pending}</td>
                <td>${percentage}%</td>
            </tr>
            `
        );
    }
}

// ============================================================
// RECENT SUBMISSIONS TABLE
// ============================================================

function generateSubmissionReport(submissions, students) {
    const table = document.getElementById("submissionReportTable");

    if (!table) return;

    table.innerHTML = "";

    if (submissions.length === 0) {
        table.innerHTML = emptyTableRow(5, "📭 No submissions yet.");
        return;
    }

    const studentMap = new Map(
        students.map(student => [String(student.id), student])
    );

    const sorted = [...submissions].sort(
        (a, b) => getTimestamp(b.submittedAt) - getTimestamp(a.submittedAt)
    );

    for (const submission of sorted) {
        const student = studentMap.get(
            String(submission.studentId ?? "")
        );

        const studentName =
            student?.name ||
            submission.studentName ||
            "Unknown";

        const studentClass =
            student?.class ??
            submission.class ??
            submission.studentClass ??
            "";

        const section =
            student?.section ??
            submission.section ??
            submission.studentSection ??
            "";

        const passageTitle =
            submission.passageTitle ||
            submission.title ||
            "Reading Passage";

        const status = String(submission.status || "completed").toLowerCase();

        const statusLabel = ["completed", "submitted"].includes(status)
            ? "✅ Completed"
            : escapeHTML(status);

        table.insertAdjacentHTML(
            "beforeend",
            `
            <tr>
                <td>${escapeHTML(studentName)}</td>
                <td>${escapeHTML(studentClass)}</td>
                <td>${escapeHTML(section)}</td>
                <td>${escapeHTML(passageTitle)}</td>
                <td>${statusLabel}</td>
            </tr>
            `
        );
    }
}

// ============================================================
// COMMON HELPERS
// ============================================================

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = String(value);
    }
}

function normaliseClass(value) {
    return String(value ?? "").trim();
}

function normaliseSection(value) {
    return String(value ?? "").trim().toUpperCase();
}

function compareClassNames(a, b) {
    const numberA = Number(a);
    const numberB = Number(b);

    if (Number.isFinite(numberA) && Number.isFinite(numberB)) {
        return numberA - numberB;
    }

    return String(a).localeCompare(String(b));
}

function getTimestamp(value) {
    if (value && typeof value.toMillis === "function") {
        return value.toMillis();
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
}

function emptyTableRow(columnCount, message) {
    return `
        <tr>
            <td colspan="${columnCount}"
                style="text-align:center;padding:20px;">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

/* =========================================================
   PART 2: INDIVIDUAL STUDENT REPORT
   Supports both old and new TRACE submission formats.
   ========================================================= */

/**
 * Creates the individual student report section and dropdown.
 * Students are identified by their Firestore document ID.
 */

function loadStudentReportSelector() {
    let section = document.getElementById("individualStudentReport");

    if (!section) {
        section = document.createElement("section");
        section.id = "individualStudentReport";
        section.className = "report-section";

        const reportsContainer =
            document.getElementById("reportsContainer") ||
            document.getElementById("reportsContent") ||
            document.querySelector("main") ||
            document.body;

        reportsContainer.appendChild(section);
    }

    section.innerHTML = `
        <div class="report-section-header">
            <h2>Individual Student Report</h2>
            <p>Select a class, section and student to generate the report.</p>
        </div>

        <div class="student-report-controls">

            <label for="studentReportClassSelector">
                Select Class
            </label>
            <select id="studentReportClassSelector">
                <option value="">-- Select Class --</option>
            </select>

            <label for="studentReportSectionSelector">
                Select Section
            </label>
            <select id="studentReportSectionSelector" disabled>
                <option value="">-- Select Section --</option>
            </select>

            <label for="studentReportSelector">
                Select Student
            </label>
            <select id="studentReportSelector" disabled>
                <option value="">-- Select Student --</option>
            </select>

            <button type="button" id="viewStudentReportBtn">
                Generate Report
            </button>

            <button type="button" id="printStudentReportBtn">
                Print Report
            </button>
        </div>

        <div id="studentReportMessage" role="status"></div>
        <div id="studentReportCard"></div>
    `;

    const classSelector =
        document.getElementById("studentReportClassSelector");
    const sectionSelector =
        document.getElementById("studentReportSectionSelector");
    const studentSelector =
        document.getElementById("studentReportSelector");

    const getClass = student =>
        String(student.class ?? student.studentClass ?? "").trim();

    const getSection = student =>
        String(student.section ?? student.studentSection ?? "").trim();

    const getName = student =>
        String(student.name ?? student.studentName ?? "Unnamed Student");

    const classes = [...new Set(
        reportStudents.map(getClass).filter(Boolean)
    )].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );

    classes.forEach(className => {
        const option = document.createElement("option");
        option.value = className;
        option.textContent = `Class ${className}`;
        classSelector.appendChild(option);
    });

    function updateSections() {
        sectionSelector.innerHTML =
            '<option value="">-- Select Section --</option>';

        studentSelector.innerHTML =
            '<option value="">-- Select Student --</option>';

        sectionSelector.disabled = true;
        studentSelector.disabled = true;

        const selectedClass = classSelector.value;

        if (!selectedClass) {
            return;
        }

        const sections = [...new Set(
            reportStudents
                .filter(student => getClass(student) === selectedClass)
                .map(getSection)
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));

        sections.forEach(sectionName => {
            const option = document.createElement("option");
            option.value = sectionName;
            option.textContent = `Section ${sectionName}`;
            sectionSelector.appendChild(option);
        });

        sectionSelector.disabled = false;
    }

    function updateStudents() {
        studentSelector.innerHTML =
            '<option value="">-- Select Student --</option>';

        studentSelector.disabled = true;

        const selectedClass = classSelector.value;
        const selectedSection = sectionSelector.value;

        if (!selectedClass || !selectedSection) {
            return;
        }

        const students = reportStudents
            .filter(student =>
                getClass(student) === selectedClass &&
                getSection(student) === selectedSection
            )
            .sort((a, b) => getName(a).localeCompare(getName(b)));

        students.forEach(student => {
            const option = document.createElement("option");

            // Use the actual Firestore document ID.
            option.value = student.id;
            option.textContent = getName(student);

            studentSelector.appendChild(option);
        });

        studentSelector.disabled = false;
    }

    classSelector.addEventListener("change", () => {
        updateSections();

        document.getElementById("studentReportCard").innerHTML = "";
        document.getElementById("studentReportMessage").textContent = "";
    });

    sectionSelector.addEventListener("change", () => {
        updateStudents();

        document.getElementById("studentReportCard").innerHTML = "";
        document.getElementById("studentReportMessage").textContent = "";
    });

    document
        .getElementById("viewStudentReportBtn")
        .addEventListener("click", generateIndividualStudentReport);

    document
        .getElementById("printStudentReportBtn")
        .addEventListener("click", printIndividualStudentReport);
}

/**
 * Displays the selected student's report.
 */
function generateIndividualStudentReport() {
    const selector = document.getElementById("studentReportSelector");
    const message = document.getElementById("studentReportMessage");
    const output = document.getElementById("studentReportCard");

    if (!selector || !output) {
        console.error("The individual student report section is missing.");
        return;
    }

    const selectedStudentId = selector.value;

    if (!selectedStudentId) {
        if (message) {
            message.textContent = "Please select a student first.";
        }

        output.innerHTML = "";
        return;
    }

    // Match by exact document ID, not by name.
    const student = reportStudents.find(
        item => item.id === selectedStudentId
    );

    if (!student) {
        if (message) {
            message.textContent = "Student record not found.";
        }

        output.innerHTML = "";
        return;
    }

    if (message) {
        message.textContent = "";
    }

    const studentName =
        student.name ||
        student.studentName ||
        "Unnamed Student";

    const studentClass =
        student.class ??
        student.studentClass ??
        "";

    const studentSection =
        student.section ??
        student.studentSection ??
        "";

    /*
     * Support both submission schemas:
     *
     * Older:
     * transcript, readingTime, slideTranscripts,
     * slideReadingTimes, status: "completed"
     *
     * Newer:
     * transcripts, readingTimes, totalSlides,
     * completedSlides, status: "submitted"
     */
    const studentSubmissions = reportSubmissions
        .filter(submission => {
            const submissionStudentId =
                submission.studentId ??
                submission.studentDocId ??
                "";

            return String(submissionStudentId) ===
                String(student.id);
        })
        .filter(submission => {
            const status = String(
                submission.status || ""
            ).toLowerCase();

            return status === "completed" ||
                   status === "submitted";
        })
        .sort((a, b) => {
            return getTimestamp(b.submittedAt) -
                   getTimestamp(a.submittedAt);
        });

    const latestByPassage = new Map();

    studentSubmissions.forEach(submission => {
        const passageId =
            submission.passageId ||
            submission.assignmentId ||
            submission.passageTitle ||
            "unknown-passage";

        // Submissions are sorted newest first.
        // Keep the latest attempt for each passage.
        if (!latestByPassage.has(String(passageId))) {
            latestByPassage.set(String(passageId), submission);
        }
    });

    const latestSubmissions = [...latestByPassage.values()]
        .sort((a, b) => {
            return getTimestamp(b.submittedAt) -
                   getTimestamp(a.submittedAt);
        });

    const totalAttempts = studentSubmissions.length;
    const uniquePassagesCompleted = latestSubmissions.length;

    const totalReadingSeconds = latestSubmissions.reduce(
        (total, submission) => {
            return total + getSubmissionReadingSeconds(submission);
        },
        0
    );

    const totalSlidesRead = latestSubmissions.reduce(
        (total, submission) => {
            return total + getSubmissionCompletedSlides(submission);
        },
        0
    );

    const totalSlidesAssigned = latestSubmissions.reduce(
        (total, submission) => {
            return total + getSubmissionTotalSlides(submission);
        },
        0
    );

   output.innerHTML = `
        <div class="student-report-card">
            <div class="student-report-heading">
                <div>
                    <h3>${escapeHTML(studentName)}</h3>
                    <p>
                        Class ${escapeHTML(String(studentClass))}
                        ${studentSection
                            ? ` | Section ${escapeHTML(String(studentSection))}`
                            : ""}
                    </p>
                    <p>
                        Student ID:
                        ${escapeHTML(String(student.id))}
                    </p>
                </div>

                <div class="student-report-date">
                    <strong>Report generated</strong>
                    <span>${escapeHTML(new Date().toLocaleDateString())}</span>
                </div>
            </div>

            <div class="student-report-summary">
                <div class="student-report-stat">
                    <span class="stat-label">Passages Completed</span>
                    <strong>${uniquePassagesCompleted}</strong>
                </div>

                <div class="student-report-stat">
                    <span class="stat-label">Total Attempts</span>
                    <strong>${totalAttempts}</strong>
                </div>

                <div class="student-report-stat">
                    <span class="stat-label">Reading Time</span>
                    <strong>${escapeHTML(formatReadingDuration(totalReadingSeconds))}</strong>
                </div>

                <div class="student-report-stat">
                    <span class="stat-label">Slides Read</span>
                    <strong>${totalSlidesRead} / ${totalSlidesAssigned}</strong>
                </div>
            </div>

            <div class="student-report-details">
                <h4>Reading Assessment History</h4>

                ${
                    latestSubmissions.length
                        ? renderStudentSubmissionTable(latestSubmissions)
                        : `
                            <p class="empty-report-message">
                                No completed reading assessments were found
                                for this student.
                            </p>
                        `
                }
            </div>
              </div>
    `;

    // Attach click handlers after the report HTML is created.
    connectSubmissionAnalysisButtons();
}

/**
 * Converts a submission's reading time into seconds.
 * Supports the old and new TRACE field names.
 */
function getSubmissionReadingSeconds(submission) {
    const possibleValues = [
        submission.readingTime,
        submission.totalReadingTime,
        submission.finalReadingTime
    ];

    for (const value of possibleValues) {
        const seconds = parseReadingTime(value);

        if (seconds !== null) {
            return seconds;
        }
    }

    const slideTimes =
        submission.slideReadingTimes ??
        submission.readingTimes;

    if (Array.isArray(slideTimes)) {
        return slideTimes.reduce((sum, value) => {
            const seconds = parseReadingTime(value);
            return sum + (seconds ?? 0);
        }, 0);
    }

    return 0;
}


/**
 * Parses common reading-time formats.
 *
 * Examples:
 * 45       -> 45 seconds
 * "45"     -> 45 seconds
 * "01:20"  -> 80 seconds
 * "1:02:30"-> 3750 seconds
 */
function parseReadingTime(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, value);
    }

    if (typeof value === "object") {
        if (typeof value.seconds === "number") {
            return Math.max(0, value.seconds);
        }

        if (typeof value.totalSeconds === "number") {
            return Math.max(0, value.totalSeconds);
        }

        return null;
    }

    const textValue = String(value).trim();

    if (!textValue) {
        return null;
    }

    if (/^\d+(\.\d+)?$/.test(textValue)) {
        return Math.max(0, Number(textValue));
    }

    const parts = textValue.split(":").map(Number);

    if (
        parts.length >= 2 &&
        parts.length <= 3 &&
        parts.every(part => Number.isFinite(part) && part >= 0)
    ) {
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }

        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return null;
}


/**
 * Formats seconds as minutes and seconds.
 */
function formatReadingDuration(totalSeconds) {
    const seconds = Math.max(0, Math.round(totalSeconds || 0));

    if (seconds < 60) {
        return `${seconds} sec`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
        return `${minutes} min ${remainingSeconds} sec`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours} hr ${remainingMinutes} min`;
}


/**
 * Counts completed slides when available.
 */
function getSubmissionCompletedSlides(submission) {
    if (Number.isFinite(Number(submission.completedSlides))) {
        return Math.max(0, Number(submission.completedSlides));
    }

    const transcriptSlides =
        submission.slideTranscripts ??
        submission.transcripts;

    if (Array.isArray(transcriptSlides)) {
        return transcriptSlides.filter(item => {
            return item !== null &&
                   item !== undefined &&
                   String(item).trim() !== "";
        }).length;
    }

    if (typeof submission.transcript === "string") {
        return submission.transcript.trim() ? 1 : 0;
    }

    return 0;
}


/**
 * Gets the total number of slides in a submission.
 */
function getSubmissionTotalSlides(submission) {
    const value =
        submission.totalSlides ??
        submission.slideCount ??
        submission.totalSlideCount;

    if (Number.isFinite(Number(value))) {
        return Math.max(0, Number(value));
    }

    const transcriptSlides =
        submission.slideTranscripts ??
        submission.transcripts;

    if (Array.isArray(transcriptSlides)) {
        return transcriptSlides.length;
    }

    return 0;
}


/**
 * Builds the reading-history table.
 */
function renderStudentSubmissionTable(submissions) {
    const rows = submissions.map(submission => {
        const passageTitle =
            submission.passageTitle ||
            submission.passageName ||
            "Untitled Passage";

        const readingTime =
            getSubmissionReadingSeconds(submission);

        const slidesRead =
            getSubmissionCompletedSlides(submission);

        const totalSlides =
            getSubmissionTotalSlides(submission);

        const submittedDate = formatSubmissionDate(
            submission.submittedAt
        );

        const status = String(
            submission.status || "completed"
        );

        return `
            <tr>
                <td>${escapeHTML(passageTitle)}</td>
                <td>${escapeHTML(submittedDate)}</td>
                <td>${escapeHTML(formatReadingDuration(readingTime))}</td>
                <td>${slidesRead} / ${totalSlides}</td>
                <td>${escapeHTML(status)}</td>
                <td>
                    <button
                        type="button"
                        class="view-reading-analysis-btn"
                        data-submission-id="${escapeHTML(String(submission.id || ""))}"
                    >
                        View Analysis
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    return `
        <div class="student-report-table-wrapper">
            <table class="student-report-table">
                <thead>
                    <tr>
                        <th>Passage</th>
                        <th>Date</th>
                        <th>Reading Time</th>
                        <th>Slides Read</th>
                        <th>Status</th>
                        <th>Analysis</th>
                    </tr>
                </thead>

                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}


/**
 * Formats Firestore timestamps, Date objects and date strings.
 */
function formatSubmissionDate(value) {
    if (!value) {
        return "Date unavailable";
    }

    let date;

    if (typeof value.toDate === "function") {
        date = value.toDate();
    } else if (value instanceof Date) {
        date = value;
    } else if (typeof value.seconds === "number") {
        date = new Date(value.seconds * 1000);
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString();
}


/**
 * Prints the selected student's report.
 * The detailed analysis/printing functions will be connected
 * in the following parts.
 */
function printIndividualStudentReport() {
    const report = document.getElementById("studentReportCard");

    if (!report || !report.innerHTML.trim()) {
        alert("Please select a student and generate the report first.");
        return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("The print window was blocked. Allow pop-ups and try again.");
        return;
    }

    printWindow.document.open();

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TRACE Student Reading Report</title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 24px;
                    color: #222;
                }

                h2, h3, h4 {
                    margin-top: 0;
                }

                .student-report-heading {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 12px;
                    margin-bottom: 18px;
                }

                .student-report-summary {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin: 20px 0;
                }

                .student-report-stat {
                    border: 1px solid #aaa;
                    padding: 12px;
                }

                .student-report-stat strong,
                .stat-label {
                    display: block;
                    margin-bottom: 6px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 12px;
                }

                th, td {
                    border: 1px solid #aaa;
                    padding: 8px;
                    text-align: left;
                    overflow-wrap: anywhere;
                }

                th {
                    background: #eee;
                }

                button {
                    display: none !important;
                }

                @media print {
                    body {
                        margin: 10mm;
                    }

                    .student-report-summary {
                        grid-template-columns: repeat(4, 1fr);
                    }

                    tr {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>

        <body>
            <h2>TRACE — Reading Assessment Report</h2>
            ${report.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
    }, 300);
}

/* =========================================================
   PART 3: PASSAGE ANALYSIS AND READING PERFORMANCE
   ========================================================= */


/**
 * Returns a normalized transcript from an old or new submission.
 */
function getSubmissionTranscript(submission) {
    if (!submission) {
        return "";
    }

    // Old TRACE format.
    if (
        typeof submission.transcript === "string" &&
        submission.transcript.trim()
    ) {
        return submission.transcript.trim();
    }

    // New TRACE format.
    const transcripts =
        submission.transcripts ??
        submission.slideTranscripts;

    if (Array.isArray(transcripts)) {
        return transcripts
            .map(item => {
                if (typeof item === "string") {
                    return item.trim();
                }

                if (item && typeof item === "object") {
                    return String(
                        item.transcript ??
                        item.text ??
                        item.recognizedText ??
                        ""
                    ).trim();
                }

                return "";
            })
            .filter(Boolean)
            .join(" ");
    }

    if (typeof transcripts === "string") {
        return transcripts.trim();
    }

    return "";
}


/**
 * Converts text into comparable words.
 * Punctuation and capitalization are ignored.
 */
function getComparableWords(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/[^a-z0-9'\s-]/g, " ")
        .split(/\s+/)
        .map(word => word.replace(/^-+|-+$/g, ""))
        .filter(Boolean);
}





/**
 * Gets a passage title from a passage or assignment object.
 */
function getPassageDisplayTitle(passage, submission) {
    return (
        passage?.title ||
        passage?.passageTitle ||
        passage?.name ||
        submission?.passageTitle ||
        "Reading Passage"
    );
}


/**
 * Calculates reading performance by comparing the reference
 * passage with the recognized transcript.
 *
 * This is an approximate text comparison, not a validated
 * pronunciation or phoneme-level assessment.
 */
function calculateReadingPerformance(referenceText, transcriptText) {
    const referenceWords = getComparableWords(referenceText);
    const transcriptWords = getComparableWords(transcriptText);

    const referenceCount = referenceWords.length;
    const transcriptCount = transcriptWords.length;

    if (referenceCount === 0) {
        return {
            referenceWords,
            transcriptWords,
            referenceCount: 0,
            transcriptCount,
            correct: 0,
            substitutions: 0,
            omissions: 0,
            insertions: transcriptCount,
            accuracy: 0,
            wordAccuracy: 0
        };
    }

    /*
     * Levenshtein-style word alignment:
     * - correct: matching words
     * - substitution: a different word in the same alignment
     * - omission: a reference word not recognized
     * - insertion: an extra recognized word
     */
    const rows = referenceCount + 1;
    const columns = transcriptCount + 1;

    const distance = Array.from(
        { length: rows },
        () => Array(columns).fill(0)
    );

    const operation = Array.from(
        { length: rows },
        () => Array(columns).fill("")
    );

    for (let i = 1; i < rows; i++) {
        distance[i][0] = i;
        operation[i][0] = "omission";
    }

    for (let j = 1; j < columns; j++) {
        distance[0][j] = j;
        operation[0][j] = "insertion";
    }

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < columns; j++) {
            if (referenceWords[i - 1] === transcriptWords[j - 1]) {
                distance[i][j] = distance[i - 1][j - 1];
                operation[i][j] = "correct";
            } else {
                const substitutionCost =
                    distance[i - 1][j - 1] + 1;

                const omissionCost =
                    distance[i - 1][j] + 1;

                const insertionCost =
                    distance[i][j - 1] + 1;

                const minimum = Math.min(
                    substitutionCost,
                    omissionCost,
                    insertionCost
                );

                distance[i][j] = minimum;

                if (minimum === substitutionCost) {
                    operation[i][j] = "substitution";
                } else if (minimum === omissionCost) {
                    operation[i][j] = "omission";
                } else {
                    operation[i][j] = "insertion";
                }
            }
        }
    }

    let i = referenceCount;
    let j = transcriptCount;

    const alignedWords = [];

    let correct = 0;
    let substitutions = 0;
    let omissions = 0;
    let insertions = 0;

    while (i > 0 || j > 0) {
        const currentOperation = operation[i][j];

        if (
            i > 0 &&
            j > 0 &&
            currentOperation === "correct"
        ) {
            alignedWords.push({
                reference: referenceWords[i - 1],
                spoken: transcriptWords[j - 1],
                type: "correct"
            });

            correct++;
            i--;
            j--;
        } else if (
            i > 0 &&
            j > 0 &&
            currentOperation === "substitution"
        ) {
            alignedWords.push({
                reference: referenceWords[i - 1],
                spoken: transcriptWords[j - 1],
                type: "substitution"
            });

            substitutions++;
            i--;
            j--;
        } else if (
            i > 0 &&
            (
                currentOperation === "omission" ||
                j === 0
            )
        ) {
            alignedWords.push({
                reference: referenceWords[i - 1],
                spoken: "",
                type: "omission"
            });

            omissions++;
            i--;
        } else if (j > 0) {
            alignedWords.push({
                reference: "",
                spoken: transcriptWords[j - 1],
                type: "insertion"
            });

            insertions++;
            j--;
        } else {
            break;
        }
    }

    alignedWords.reverse();

    const accuracy = Math.max(
        0,
        Math.min(
            100,
            ((correct / referenceCount) * 100)
        )
    );

    return {
        referenceWords,
        transcriptWords,
        alignedWords,
        referenceCount,
        transcriptCount,
        correct,
        substitutions,
        omissions,
        insertions,
        accuracy: Number(accuracy.toFixed(1)),
        wordAccuracy: Number(accuracy.toFixed(1))
    };
}


/**
 * Converts the word alignment into colored HTML.
 */
function renderWordAlignment(performance) {
    if (!performance || !performance.alignedWords?.length) {
        return `
            <p class="analysis-empty">
                There is not enough text to compare.
            </p>
        `;
    }

    const legend = `
        <div class="word-analysis-legend">
            <span class="word-legend-correct">Correct</span>
            <span class="word-legend-substitution">Substitution</span>
            <span class="word-legend-omission">Omission</span>
            <span class="word-legend-insertion">Insertion</span>
        </div>
    `;

    const words = performance.alignedWords.map(item => {
        const reference = escapeHTML(item.reference || "");
        const spoken = escapeHTML(item.spoken || "");

        if (item.type === "correct") {
            return `
                <span class="word-result correct" title="Recognized word">
                    ${reference}
                </span>
            `;
        }

        if (item.type === "substitution") {
            return `
                <span class="word-result substitution"
                      title="Expected: ${reference}; recognized: ${spoken}">
                    ${reference}
                    <small>(${spoken || "not recognized"})</small>
                </span>
            `;
        }

        if (item.type === "omission") {
            return `
                <span class="word-result omission"
                      title="Expected word not recognized">
                    ${reference}
                    <small>(omitted)</small>
                </span>
            `;
        }

        return `
            <span class="word-result insertion"
                  title="Additional recognized word">
                +${spoken}
            </span>
        `;
    }).join(" ");

    return `
        ${legend}
        <div class="word-alignment-results">${words}</div>
    `;
}


/**
 * Shows the analysis of a particular submission.
 * This function is called by the View Analysis buttons.
 */
function showSubmissionAnalysis(submissionId) {
    const studentId =
        document.getElementById("studentReportSelector")?.value;

    if (!studentId || !submissionId) {
        return;
    }

    const submission = reportSubmissions.find(item => {
        return String(item.id) === String(submissionId);
    });

    if (!submission) {
        alert("The selected submission could not be found.");
        return;
    }

    // Prevent accidentally displaying another student's submission.
    const submissionStudentId =
        submission.studentId ??
        submission.studentDocId ??
        "";

    if (String(submissionStudentId) !== String(studentId)) {
        alert("This submission does not belong to the selected student.");
        return;
    }

    const passage = findPassageForSubmission(submission);
    const referenceText = getPassageReferenceText(passage);
    const transcriptText = getSubmissionTranscript(submission);

    const performance = calculateReadingPerformance(
        referenceText,
        transcriptText
    );

    const title = getPassageDisplayTitle(passage, submission);

    let analysisContainer =
        document.getElementById("submissionAnalysisPanel");

    if (!analysisContainer) {
        analysisContainer = document.createElement("section");
        analysisContainer.id = "submissionAnalysisPanel";
        analysisContainer.className = "submission-analysis-panel";

        const reportCard =
            document.getElementById("studentReportCard");

        if (reportCard) {
            reportCard.appendChild(analysisContainer);
        }
    }

    analysisContainer.innerHTML = `
        <div class="analysis-panel-header">
            <h3>Reading Analysis: ${escapeHTML(title)}</h3>

            <button
                type="button"
                id="closeSubmissionAnalysisBtn"
                aria-label="Close reading analysis"
            >
                Close
            </button>
        </div>

        <div class="analysis-metrics">
            <div class="analysis-metric">
                <span>Word Accuracy</span>
                <strong>${performance.accuracy}%</strong>
            </div>

            <div class="analysis-metric">
                <span>Correct Words</span>
                <strong>${performance.correct}</strong>
            </div>

            <div class="analysis-metric">
                <span>Substitutions</span>
                <strong>${performance.substitutions}</strong>
            </div>

            <div class="analysis-metric">
                <span>Omissions</span>
                <strong>${performance.omissions}</strong>
            </div>

            <div class="analysis-metric">
                <span>Insertions</span>
                <strong>${performance.insertions}</strong>
            </div>
        </div>

        <div class="analysis-text-section">
            <h4>Reference Passage</h4>
            <p>${escapeHTML(referenceText || "Reference passage text is unavailable.")}</p>
        </div>

        <div class="analysis-text-section">
            <h4>Recognized Transcript</h4>
            <p>${escapeHTML(transcriptText || "No transcript was saved for this submission.")}</p>
        </div>

        <div class="analysis-text-section">
            <h4>Word-by-Word Comparison</h4>
            ${
                referenceText && transcriptText
                    ? renderWordAlignment(performance)
                    : `
                        <p class="analysis-empty">
                            Word comparison requires both the reference
                            passage and a saved transcript.
                        </p>
                    `
            }
        </div>

        <p class="analysis-disclaimer">
            This analysis compares recognized words with the reference text.
            It does not independently measure pronunciation quality,
            fluency, expression or comprehension.
        </p>
    `;

    document
        .getElementById("closeSubmissionAnalysisBtn")
        ?.addEventListener("click", () => {
            analysisContainer.innerHTML = "";
        });

    analysisContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}





/**
 * Counts words in a passage or transcript.
 */
function countReadingWords(text) {
    return getComparableWords(text).length;
}


/**
 * Calculates words per minute.
 *
 * This is meaningful only when the saved reading time is
 * accurate and greater than zero.
 */
function calculateWordsPerMinute(wordCount, seconds) {
    const totalWords = Number(wordCount);
    const totalSeconds = Number(seconds);

    if (
        !Number.isFinite(totalWords) ||
        !Number.isFinite(totalSeconds) ||
        totalWords < 0 ||
        totalSeconds <= 0
    ) {
        return 0;
    }

    return Number(
        (totalWords / (totalSeconds / 60)).toFixed(1)
    );
}


/**
 * Returns a summary object for a single submission.
 */
function getSubmissionAnalysisSummary(submission) {
    const passage = findPassageForSubmission(submission);

    const referenceText = getPassageReferenceText(passage);
    const transcriptText = getSubmissionTranscript(submission);

    const performance = calculateReadingPerformance(
        referenceText,
        transcriptText
    );

    const readingSeconds =
        getSubmissionReadingSeconds(submission);

    return {
        passageTitle: getPassageDisplayTitle(passage, submission),
        referenceWordCount: countReadingWords(referenceText),
        transcriptWordCount: countReadingWords(transcriptText),
        readingSeconds,
        wordsPerMinute: calculateWordsPerMinute(
            countReadingWords(transcriptText),
            readingSeconds
        ),
        accuracy: performance.accuracy,
        correct: performance.correct,
        substitutions: performance.substitutions,
        omissions: performance.omissions,
        insertions: performance.insertions,
        hasReferenceText: Boolean(referenceText),
        hasTranscript: Boolean(transcriptText)
    };
}


/**
 * Normalizes saved word-analysis entries.
 *
 * Missing words in the recognized transcript are omissions,
 * not correct words.
 */
function normaliseSavedWordAnalysis(savedWords) {
    if (!Array.isArray(savedWords)) {
        return [];
    }

    return savedWords.map(item => {
        if (typeof item === "string") {
            return {
                word: item,
                type: "correct"
            };
        }

        const word = String(
            item?.word ??
            item?.reference ??
            item?.expected ??
            ""
        );

        const recognized = String(
            item?.spoken ??
            item?.recognized ??
            item?.recognizedWord ??
            ""
        );

        let type = String(item?.type || "").toLowerCase();

        if (!type) {
            if (item?.correct === true) {
                type = "correct";
            } else if (
                item?.omitted === true ||
                item?.missing === true ||
                !recognized
            ) {
                type = "omission";
            } else if (word.toLowerCase() === recognized.toLowerCase()) {
                type = "correct";
            } else {
                type = "substitution";
            }
        }

        const allowedTypes = [
            "correct",
            "substitution",
            "omission",
            "insertion"
        ];

        if (!allowedTypes.includes(type)) {
            type = "omission";
        }

        return {
            word,
            recognized,
            type
        };
    });
}


/**
 * Styles used by the passage analysis.
 *
 * These styles are inserted once and do not replace your
 * existing css/style.css file.
 */
function ensureReadingAnalysisStyles() {
    if (document.getElementById("traceReadingAnalysisStyles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "traceReadingAnalysisStyles";

    style.textContent = `
        .student-report-card,
        .submission-analysis-panel {
            margin-top: 20px;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #dbe2ea;
            border-radius: 12px;
        }

        .student-report-heading,
        .analysis-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
        }

        .student-report-summary,
        .analysis-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin: 20px 0;
        }

        .student-report-stat,
        .analysis-metric {
            padding: 14px;
            border: 1px solid #dbe2ea;
            border-radius: 8px;
            background: #f8fafc;
        }

        .student-report-stat strong,
        .analysis-metric strong,
        .stat-label,
        .analysis-metric span {
            display: block;
        }

        .stat-label,
        .analysis-metric span {
            margin-bottom: 8px;
            color: #526173;
            font-size: 13px;
        }

        .student-report-table-wrapper {
            overflow-x: auto;
        }

        .student-report-table {
            width: 100%;
            border-collapse: collapse;
        }

        .student-report-table th,
        .student-report-table td {
            border: 1px solid #dbe2ea;
            padding: 10px;
            text-align: left;
        }

        .student-report-table th {
            background: #f1f5f9;
        }

        .word-analysis-legend {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin: 12px 0;
        }

        .word-analysis-legend span,
        .word-result {
            display: inline-block;
            padding: 4px 7px;
            margin: 3px 2px;
            border-radius: 4px;
        }

        .word-legend-correct,
        .word-result.correct {
            background: #dcfce7;
            color: #166534;
        }

        .word-legend-substitution,
        .word-result.substitution {
            background: #fef3c7;
            color: #92400e;
        }

        .word-legend-omission,
        .word-result.omission {
            background: #fee2e2;
            color: #991b1b;
        }

        .word-legend-insertion,
        .word-result.insertion {
            background: #dbeafe;
            color: #1e40af;
        }

        .word-result small {
            display: block;
            font-size: 11px;
        }

        .word-alignment-results {
            line-height: 2.3;
        }

        .analysis-text-section {
            margin-top: 20px;
        }

        .analysis-text-section p {
            line-height: 1.7;
            overflow-wrap: anywhere;
        }

        .analysis-disclaimer,
        .analysis-empty,
        .empty-report-message {
            color: #64748b;
            font-size: 13px;
        }

        @media (max-width: 600px) {
            .student-report-card,
            .submission-analysis-panel {
                padding: 12px;
            }
        }

        @media print {
            .analysis-panel-header button,
            .student-report-controls,
            .view-reading-analysis-btn {
                display: none !important;
            }

            .student-report-card,
            .submission-analysis-panel {
                border: none;
                padding: 0;
            }
        }
    `;

    document.head.appendChild(style);
}


/**
 * Install the analysis styles and connect the buttons.
 */
ensureReadingAnalysisStyles();
connectSubmissionAnalysisButtons();

/* =========================================================
   PART 4: FINAL INTEGRATION AND ERROR HANDLING
   ========================================================= */


/**
 * Loads passage records when the Firestore "passages"
 * collection exists and the current user has permission.
 *
 * This supports passage lookup in Part 3. If your project
 * stores passages in another collection, update the name.
 */
async function loadTracePassages() {
    if (!(reportPassages instanceof Map)) {
        reportPassages = new Map();
    }

    try {
        const snapshot = await getDocs(
            collection(db, "passages")
        );

        snapshot.forEach(documentSnapshot => {
            reportPassages.set(documentSnapshot.id, {
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            });
        });

        return reportPassages;
    } catch (error) {
        console.warn(
            'TRACE: Could not load the "passages" collection.',
            error
        );

        // Reports can still be displayed without passage analysis.
        return reportPassages;
    }
}


/**
 * Finds passage text using a wider range of common field names.
 * Use this in place of the Part 3 getPassageReferenceText()
 * function if your passage records use one of these fields.
 */

function getPassageReferenceText(passage) {
    if (!passage) {
        return "";
    }

    // Check common fields that may contain the complete passage.
    const possibleFields = [
        passage.text,
        passage.passageText,
        passage.content,
        passage.passageContent,
        passage.referenceText,
        passage.readingText,
        passage.paragraph,
        passage.story,
        passage.body
    ];

    const textValue = possibleFields.find(value =>
        typeof value === "string" && value.trim() !== ""
    );

    if (textValue) {
        return textValue.trim();
    }

    // Read slide1, slide2, slide3, etc. in numerical order.
    const slideKeys = Object.keys(passage)
        .filter(key => /^slide\d+$/i.test(key))
        .sort((a, b) =>
            Number(a.match(/\d+/)[0]) -
            Number(b.match(/\d+/)[0])
        );

    return slideKeys
        .map(key => passage[key])
        .filter(value =>
            typeof value === "string" && value.trim() !== ""
        )
        .map(value => value.trim())
        .join(" ");
}


/**
 * Searches the passage collection, assignments and submission
 * for the original reading passage.
 *
 * This replaces the Part 3 findPassageForSubmission().
 */
function findPassageForSubmission(submission) {
    if (!submission) {
        return null;
    }

    const passageId = submission.passageId;
    const assignmentId = submission.assignmentId;

    // First look in the dedicated passage collection.
    if (passageId && reportPassages instanceof Map) {
        const passage = reportPassages.get(String(passageId));

        if (passage) {
            return passage;
        }
    }

    // Next look through assignments.
    const assignment = reportAssignments.find(item => {
        return (
            (assignmentId &&
                String(item.id) === String(assignmentId)) ||
            (passageId &&
                String(item.passageId) === String(passageId))
        );
    });

    if (assignment && getPassageReferenceText(assignment)) {
        return assignment;
    }

    // Some projects store the passage itself in the submission.
    const embeddedText =
        submission.passageText ||
        submission.passageContent ||
        submission.referenceText ||
        submission.readingText;

    if (embeddedText) {
        return {
            id: passageId || assignmentId || "",
            title: submission.passageTitle || "Reading Passage",
            text: embeddedText
        };
    }

    return assignment || null;
}


/**
 * Safely loads TRACE report data.
 *
 * REPLACE the generateReports() function from Part 1 with
 * this version. Do not keep two copies of generateReports().
 */
async function generateReports() {
    const errorContainer =
        document.getElementById("reportsError");

    if (errorContainer) {
        errorContainer.textContent = "";
    }

    try {
        const [
            studentsSnapshot,
            assignmentsSnapshot,
            submissionsSnapshot
        ] = await Promise.all([
            getDocs(collection(db, "students")),
            getDocs(collection(db, "assignments")),
            getDocs(collection(db, "submissions"))
        ]);

        reportStudents = studentsSnapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        reportAssignments = assignmentsSnapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        reportSubmissions = submissionsSnapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        // Load passages separately so a missing or inaccessible
        // passage collection does not stop the main report.
        await loadTracePassages();

        updateTraceSummaryCards();
       generateClassReport(
    reportStudents,
    reportAssignments,
    reportSubmissions
);
      generateSectionReport(
    reportStudents,
    reportAssignments,
    reportSubmissions
);
      generateSubmissionReport(
    reportSubmissions,
    reportStudents
);

        // Refresh the student dropdown after the records load.
        loadStudentReportSelector();

        console.info("TRACE reports loaded successfully.", {
            students: reportStudents.length,
            assignments: reportAssignments.length,
            submissions: reportSubmissions.length,
            passages: reportPassages.size
        });
    } catch (error) {
        console.error("TRACE report loading failed:", error);

        if (errorContainer) {
            errorContainer.textContent =
                "Reports could not be loaded. Check your internet connection, " +
                "Firebase configuration and Firestore permissions.";
        } else {
            alert(
                "TRACE reports could not be loaded. " +
                "Check the browser console for the error."
            );
        }
    }
}


/**
 * Updates summary cards if the Part 1 report layout uses
 * the element IDs listed below.
 *
 * Missing elements are ignored so this function does not
 * require a particular dashboard layout.
 */
function updateTraceSummaryCards() {
    const completedSubmissions = reportSubmissions.filter(item => {
        const status = String(item.status || "").toLowerCase();

        return status === "completed" || status === "submitted";
    });

    const uniqueStudentIds = new Set(
        completedSubmissions
            .map(item => item.studentId)
            .filter(Boolean)
            .map(String)
    );

    const values = {
        totalStudents: reportStudents.length,
        totalAssignments: reportAssignments.length,
        totalSubmissions: reportSubmissions.length,
        completedSubmissions: completedSubmissions.length,
        studentsParticipated: uniqueStudentIds.size
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = String(value);
        }
    });
}


/**
 * Connects View Analysis buttons after the report table has
 * been rendered.
 *
 * IMPORTANT: call this at the end of
 * generateIndividualStudentReport() in Part 2.
 */
function connectSubmissionAnalysisButtons() {
    document
        .querySelectorAll(".view-reading-analysis-btn")
        .forEach(button => {
            if (button.dataset.analysisConnected === "true") {
                return;
            }

            button.dataset.analysisConnected = "true";

            button.addEventListener("click", () => {
                showSubmissionAnalysis(
                    button.dataset.submissionId
                );
            });
        });
}


/**
 * Adds a readable error area to the report page if needed.
 */
function ensureReportsErrorArea() {
    if (document.getElementById("reportsError")) {
        return;
    }

    const container =
        document.getElementById("reportsContainer") ||
        document.getElementById("reportsContent") ||
        document.querySelector("main");

    if (!container) {
        return;
    }

    const errorArea = document.createElement("p");
    errorArea.id = "reportsError";
    errorArea.setAttribute("role", "alert");

    container.prepend(errorArea);
}


/**
 * Starts the report page after the document is ready.
 *
 * If your existing page already calls loadReports(),
 * continue using that entry point rather than adding a
 * second automatic initialization.
 */
function initialiseTraceReports() {
    ensureReportsErrorArea();
    ensureReadingAnalysisStyles();

    return generateReports();
}

