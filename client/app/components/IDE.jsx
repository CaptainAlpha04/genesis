import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { draculaTheme } from './DraculaTheme';
import { useSelector } from 'react-redux';

async function generateCode(language, message, code) {
  const request = {
    message: message,
    code: code,
    language: language,
  };
  const response = await fetch('http://localhost:8000/generateCode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  return data.snippet;
}

async function executeCode(language, code) {
  const request = {
    language: language,
    code: code,
  };
  const response = await fetch('http://localhost:8000/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.text();
  return data;
}

const IDE = () => {
  const [value, setValue] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  const botReply = useSelector((state) => state.botReply.botReply);
  const lang = useSelector((state) => state.language.language);

  useEffect(() => {
    if (botReply) {
      setValue(botReply);
    } else {
      const storedCode = localStorage.getItem('code') || '';
      const storedLanguage = localStorage.getItem('language') || 'javascript';
      setValue(storedCode);
      setLanguage(storedLanguage);
    }
  }, [botReply]);

  useEffect(() => {
    if (lang) {
      const languageMap = {
        'C++': 'cpp',
        'Javascript': 'javascript',
        'Python': 'python',
        'Java': 'java',
        'Typescript': 'typescript',
      };
      setLanguage(languageMap[lang] || 'javascript');
    }
  }, [lang]);

  const handleEditorChange = (value) => {
    setValue(value);
  };

  const triggerAIAssistant = () => {
    document.getElementById('my_modal_2').showModal();
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSave = () => {
    localStorage.setItem('code', value);
    localStorage.setItem('language', language);
    console.log('Code saved:', value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('dracula', draculaTheme);
  };

  const handleEditorDidMount = (editor, monaco) => {
    setEditor(editor);
    const theme = localStorage.getItem('theme') === 'dracula' ? 'dracula' : 'vs-light';
    monaco.editor.setTheme(theme);

    editor.addAction({
      id: 'trigger-ai-assistant',
      label: 'Trigger AI Assistant',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, // Ctrl + I
      ],
      run: () => {
        triggerAIAssistant();
      },
    });
  };

  const insertTextAtCursor = (textToInsert) => {
    if (editor) {
      const selection = editor.getSelection();
      const model = editor.getModel();

      const range = new monaco.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
      );

      const id = { major: 1, minor: 1 };

      editor.executeEdits(id, [
        {
          range: range,
          text: textToInsert,
          forceMoveMarkers: true,
        },
      ]);

      editor.setPosition({
        lineNumber: range.endLineNumber,
        column: range.startColumn + textToInsert.length,
      });
    }
  };

  const handleSubmit = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAssistantRequest();
    }
  };

  const handleAssistantRequest = async (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way
    const message = document.getElementById('assistantInput').value;
    setLoading(true);
    const btn = document.getElementById('assistantBtn');
    btn.disabled = true;
    const snippet = await generateCode(language, message, value);
    document.getElementById('assistantInput').value = '';
    insertTextAtCursor(snippet);
    document.getElementById('my_modal_2').close(); // Close the modal
    setLoading(false);
    btn.disabled = false;
  };

  const runCode = async () => {
    setLoading(true);
    const result = await executeCode(language, value);
    setOutput(result);
    setLoading(false);
  };

  return (
    <div className='flex flex-row w-full font-poppins h-screen'>
      <div className='flex flex-col w-3/4'>
        <dialog id="my_modal_2" className="modal">
          <div className="modal-box flex flex-col items-center gap-2">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="text-lg font-bold">AI Assistant</h3>
            <p>Enter your instructions for the coding Assistant!</p>
            <form onSubmit={handleAssistantRequest} className='flex flex-row w-full gap-2'>
              <input type="text" id="assistantInput" className="input input-bordered w-4/5" onKeyDown={handleSubmit} />
              <button type="submit" id="assistantBtn" className='btn btn-primary w-1/5'>
                {loading ? <span className="loading loading-dots loading-md"></span> : <i className='fi fi-br-paper-plane-top '></i>}
              </button>
            </form>
          </div>
        </dialog>

        <header className='flex flex-row gap-2 top-0 h-fit p-4 bg-base-100'>
          <h1 className='text-3xl font-bold'>Genesis</h1>
          <h1 className='text-3xl font-extralight'>CodeGround</h1>

          <div className='right-0 absolute pr-4 flex gap-4'>

          <button onClick={runCode} className="btn btn-primary">Run Code</button>

            <select
              id="language-select"
              className='select select-bordered select-md'
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="typescript">TypeScript</option>
            </select>

            <div className='tooltip tooltip-bottom' data-tip="Save">
              <button onClick={handleSave} className='btn btn-ghost btn-square'>
                <i className='fi fi-br-disk text-xl'></i>
              </button>
            </div>

            <div className='tooltip tooltip-bottom' data-tip="Copy">
              <button onClick={handleCopy} className='btn btn-ghost btn-square'>
                <i className='fi fi-br-duplicate text-xl'></i>
              </button>
            </div>
          </div>
        </header>
        
        <Editor
          className='mt-4'
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 16,
            tabSize: 4,
            quickSuggestions: true,
            dropIntoEditor: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            dragAndDrop: true,
            lightbulb: {
              enabled: true,
            },
          }}
        />

    </div>
        <div className='w-2/4 bg-base-300 h-screen mt-20 overflow-scroll'>
          <div>
            <div className="terminal-box p-4">
              <pre className='text-wrap'>Terminal{">\n"}{output}</pre>
            </div>
          </div>
        </div>
      </div>
  );
};

export default IDE;
