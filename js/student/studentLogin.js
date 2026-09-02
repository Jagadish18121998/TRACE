import { db } from '../../firebase/firebase.js';

import {
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const loginForm =
    document.getElementById('studentLoginForm');

loginForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    const loginId =
        document.getElementById('studentId').value.trim();

    const password =
        document.getElementById('studentPassword').value.trim();

    if(loginId === '' || password === ''){

        alert('Enter Login ID and Password');

        return;
    }

    try{

        const studentRef =
            doc(db, 'students', loginId);

        const studentSnap =
            await getDoc(studentRef);

        if(!studentSnap.exists()){

            alert('❌ Student not found');

            return;
        }

        const student =
            studentSnap.data();

        if(student.password !== password){

            alert('❌ Incorrect password');

            return;
        }

        // Save student details
        localStorage.setItem(
            'studentName',
            student.name
        );

        localStorage.setItem(
            'studentClass',
            student.class
        );

        localStorage.setItem(
            'studentSection',
            student.section
        );

        localStorage.setItem(
            'studentLoginId',
            student.loginId
        );

        alert('✅ Login successful');

        window.location.href = 'dashboard.html';
    }

    catch(error){

        console.error(error);

        alert('⚠️ Login error');
    }
});