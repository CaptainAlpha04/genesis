import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { draculaTheme } from './DraculaTheme';
import { useSelector } from 'react-redux';

const IDE = () => {
  const [value, setValue] = useState('');
  const [language, setLanguage] = useState('');

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
  
  // Adjust language if necessary
  useEffect(() => {
    if (lang) {
      const languageMap = {
        'C++': 'cpp',
        'javascript': 'javascript',
        'python': 'python',
        'java': 'java',
        'typescript': 'typescript',
      };
      setLanguage(languageMap[lang] || 'javascript');
    }
  }, [lang]);

  const handleEditorChange = (value) => {
    setValue(value);
  };

  const triggerAIAssistant = () => {
    // Implement your AI assistant logic here
    document.getElementById('my_modal_2').showModal();
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSave = () => {
    localStorage.setItem('code', value);
    localStorage.setItem('language', language);
    // Save the code to a backend or local storage
    console.log('Code saved:', value);
  };

  const handleCopy = () => {
    // Copy the code to clipboard
    navigator.clipboard.writeText(value);
  };

  const handleEditorWillMount = (monaco) => {
    // Define the theme
    monaco.editor.defineTheme('dracula', draculaTheme);
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Set the theme
    monaco.editor.setTheme('dracula');
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

  return (
    <div className='flex flex-col w-full font-poppins h-screen  '>
      <dialog id="my_modal_2" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hello!</h3>
          <p className="py-4">Press ESC key or click outside to close</p>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button">Close</button>
        </form>
      </dialog>

      <header className='flex flex-row gap-2 top-0 h-fit p-4'>
        <h1 className='text-3xl font-bold'>Genesis</h1>
        <h1 className='text-3xl font-extralight'>CodeGround</h1>

        <div className='right-0 absolute pr-4 flex gap-4'>
          <select id="language-select"
          className='select select-bordered select-md'
          value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="typescript">TypeScript</option>
          </select>

          <div className='tooltip tooltip-bottom' data-tip="Save">
          <button onClick={handleSave} 
          className='btn btn-ghost btn-square'
          >
            <i className='fi fi-br-disk text-xl'></i>
          </button>
          </div>

          <div className='tooltip tooltip-bottom' data-tip="Copy">
            <button onClick={handleCopy}
            className='btn btn-ghost btn-square'
            >
              <i className='fi fi-br-duplicate text-xl'></i>
            </button>
          </div>
        </div>
      </header>

      <Editor
        height="100%" // Adjust height to account for header
        language={language}
        value={value}
        onChange={handleEditorChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 16,
          minimap: { enabled: true, renderCharacters: true },
          tabSize: 4,
          quickSuggestions: true,
          dropIntoEditor: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          dragAndDrop: true,
          lightbulb: {
            enabled: true
          },
        }}
      />
      
      <div className='fixed bottom-0 bg-base-100 p-2 w-full right-0'>
      <p className='text-sm font-light'>Press <kbd className='kbd'>Ctrl</kbd> + <kbd className='kbd'>I</kbd> to trigger the Cybernaut</p>

      </div>
    </div>
  );
};

export default IDE;
