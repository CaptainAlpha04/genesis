"use client";
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button, Select, MenuItem, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';

const IDE = ({ code }) => {
  const [value, setValue] = useState(code);
  const [language, setLanguage] = useState("javascript");

  const handleEditorChange = (value) => {
    setValue(value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSave = () => {
    // Save the code to a backend or local storage
    console.log("Code saved:", value);
  };

  const handleReset = () => {
    setValue(code);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Online IDE
          </Typography>
          <Select
            value={language}
            onChange={handleLanguageChange}
            style={{ color: 'white', marginRight: '10px' }}
          >
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="python">Python</MenuItem>
            <MenuItem value="java">Java</MenuItem>
            <MenuItem value="cpp">C++</MenuItem>
            <MenuItem value="typescript">TypeScript</MenuItem>
          </Select>
          <IconButton color="inherit" onClick={handleSave}>
            <SaveIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleReset}>
            <RestoreIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Editor
        height="90vh"
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          fontSize: 16,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
};

export default IDE;
