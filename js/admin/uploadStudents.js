import { db } from '../../firebase/firebase.js';

import {
    doc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

window.uploadCSV = async function(){

    const file =
        document.getElementById('csvFile').files[0];

    if(!file){

        alert('Choose CSV file');

        return;
    }

    const text = await file.text();

    const rows =
        text.split('\n').slice(1);

    for(const row of rows){

        if(!row.trim()) continue;

        const [
            admnNo,
            rollNo,
            name,
            cls,
            section,
            loginId,
            password
        ] = row.split(',');

        await setDoc(
            doc(db, 'students', loginId.trim()),
            {
                admnNo: admnNo.trim(),
                rollNo: rollNo.trim(),
                name: name.trim(),
                class: cls.trim(),
                section: section.trim(),
                loginId: loginId.trim(),
                password: password.trim()
            }
        );
    }

    alert('🎉 Students uploaded successfully!');
};