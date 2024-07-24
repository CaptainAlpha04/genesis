// components/StickyNote.js
import React, { useEffect, useState } from 'react';

function StickyNote() {
    const [noteContent, setNoteContent] = useState('');
    
    useEffect(() => {
        const noteContent = localStorage.getItem('noteContent');
        if (noteContent) {
            setNoteContent(noteContent);
        }
    }, []);

    const changeNoteContent = (e) => {
        setNoteContent(e.target.value);
        localStorage.setItem('noteContent', e.target.value);
    }

    return (
        <div className="p-4 bg-base-200 rounded-lg w-full">
            <h1 className="text-xl text-base-content font-bold font-poppins">Sticky Note</h1>
            <textarea
                value={noteContent}
                onChange={changeNoteContent}
                className="w-full h-48 bg-transparent border-none resize-none p-2 outline-none"
                placeholder="Write your note here..."
            />
        </div>
    );
}

export default StickyNote;
