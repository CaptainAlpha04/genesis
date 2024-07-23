// components/StickyNote.js
import React, { useState } from 'react';

function StickyNote() {
    const [noteContent, setNoteContent] = useState('');

    return (
        <div className="w-64 p-4 bg-yellow-300 shadow-lg rounded-md bottom-8 right-8">
            <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full h-48 bg-transparent border-none resize-none p-2 outline-none"
                placeholder="Write your note here..."
            />
        </div>
    );
}

export default StickyNote;
