import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useState, useCallback } from 'react';
import SideBar from './SideBar';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function WriterPage() {
  const [value, setValue] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // Using a ref callback to ensure the editor is fully initialized
  const quillRef = useCallback((el) => {
    if (el !== null) {
      quillRef.current = el.getEditor();
    }
  }, []);

  const handleChange = (content) => {
    setValue(content);
    setWordCount(content.split(/\s+/).filter(Boolean).length); // Basic word count
  };

  // Custom toolbar actions
  const handleBold = () => {
    if (quillRef.current) {
      const editor = quillRef.current;
      editor.format('bold', !editor.getFormat().bold);
    }
  };

  const handleItalic = () => {
    if (quillRef.current) {
      const editor = quillRef.current;
      editor.format('italic', !editor.getFormat().italic);
    }
  };

  const handleUnderline = () => {
    if (quillRef.current) {
      const editor = quillRef.current;
      editor.format('underline', !editor.getFormat().underline);
    }
  };

  return (
    <section className='flex flex-row'>
      <SideBar currentPage='writerpad' />
      <div className="min-h-screen bg-gray-100 p-6 sm:p-4 md:p-6 lg:p-8">
        <div className="min-w-full mx-auto bg-white rounded-lg shadow-md p-4 md:p-6">
          <h1 className="text-4xl font-extrabold text-center mb-6 mt-4">
            <span className="block text-gradient bg-gradient-to-r from-blue-500 via-teal-400 to-green-500 bg-clip-text text-transparent">
              WriterPad
            </span>
            <span className="block text-xl text-gray-600">Your writing space</span>
          </h1>
          {/* Custom Toolbar */}
          <div className="flex gap-2 mb-4">
            <button
              className="px-2 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300 transition duration-200 ease-in-out"
              onClick={handleBold}
            >
              Bold
            </button>
            <button
              className="px-2 py-1 bg-green-200 text-green-700 rounded hover:bg-green-300 transition duration-200 ease-in-out"
              onClick={handleItalic}
            >
              Italic
            </button>
            <button
              className="px-2 py-1 bg-purple-200 text-purple-700 rounded hover:bg-purple-300 transition duration-200 ease-in-out"
              onClick={handleUnderline}
            >
              Underline
            </button>
            {/* Add more custom buttons here */}
          </div>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={handleChange}
            modules={{ toolbar: false }} // Disable the default toolbar
            formats={['bold', 'italic', 'underline']} // Define supported formats
            className="mb-6"
          />
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Word Count: {wordCount}</span>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 ease-in-out"
                onClick={() => alert('Saved!')}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition duration-200 ease-in-out"
                onClick={() => alert('Preview Mode')}
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
