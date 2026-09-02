import { db } from '../../firebase/firebase.js';

import {
    collection,
    addDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const passageForm =
    document.getElementById('passageForm');

passageForm.addEventListener('submit', async (e) => {

    e.preventDefault();

    const title =
        document.getElementById('title').value.trim();

    const slide1 =
        document.getElementById('slide1').value.trim();

    const slide2 =
        document.getElementById('slide2').value.trim();

    const cls =
        document.getElementById('class').value;

    const section =
        document.getElementById('section').value;

    try{

        await addDoc(collection(db, 'passages'), {

            title: title,
            slide1: slide1,
            slide2: slide2,

            class: cls,
            section: section,

            active: true,

            createdAt: serverTimestamp()
        });

        alert('🎉 Passage published successfully!');

        passageForm.reset();
    }

    catch(error){

        console.error(error);

        alert('⚠️ Error publishing passage');
    }
});