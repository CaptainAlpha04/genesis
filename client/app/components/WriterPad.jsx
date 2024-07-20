import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { useState } from 'react'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const modules = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
    [{ size: [] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image', 'video'],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ],
}

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image', 'video',
  'color', 'background'
]

export default function WriterPage() {
  const [value, setValue] = useState('')
  const [wordCount, setWordCount] = useState(0)

  const handleChange = (content) => {
    setValue(content)
    setWordCount(content.split(/\s+/).filter(Boolean).length) // Basic word count
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 sm:p-4 md:p-6 lg:p-8">
      <div className="min-w-full mx-auto bg-white rounded-lg shadow-md p-4 md:p-6">
        <h1 className="text-4xl font-extrabold text-center mb-6 mt-4">
          <span className="block text-gradient bg-gradient-to-r from-blue-500 via-teal-400 to-green-500 bg-clip-text text-transparent">
            LITERARY PAD
          </span>
          <span className="block text-xl text-gray-600">Your writing space</span>
        </h1>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
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
  )
}
