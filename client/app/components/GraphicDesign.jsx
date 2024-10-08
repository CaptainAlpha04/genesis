import React, { useState, useRef } from 'react';
import { CirclePicker } from 'react-color';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import SideBar from './SideBar';
import { set } from 'mongoose';

async function fetchDesign(uri, prompt) {

  const response = await fetch(`http://localhost:8000/convertGraphic/:${prompt}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: uri })
    }
  );

  const data = await response.json();
  return data.image;
}

const GraphicDesignTool = () => {
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#fff');
  const [fillColor, setFillColor] = useState('#fff');
  const [isFillEnabled, setIsFillEnabled] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [tension, setTension] = useState(0.5);
  const [elements, setElements] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [image, setImage] = useState();
  const [promptBar, setPromptBar] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);
  const isDrawing = useRef(false);
  const stageRef = useRef();

  const loadImage = async (url) => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage(img);
    };
  };

  const handleAddImage = async (imageUrl) => {
    if (imageUrl) {
      await loadImage(imageUrl);
      setElements((prevElements) => [
        ...prevElements,
        {
          tool: 'image',
          image, // make sure the image state is updated
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          draggable: true,
        },
      ]);
    }
  };
  

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const commonProps = {
      tool,
      color,
      strokeWidth,
      draggable: isDraggingEnabled,
      fill: isFillEnabled ? color : undefined,  // Use color or set a default fill color
    };
    
    if (tool === 'line') {
      setElements([...elements, { ...commonProps, points: [pos.x, pos.y, pos.x, pos.y] }]);
    } else if (tool === 'rectangle' || tool === 'circle') {
      setElements([...elements, { ...commonProps, fill: fillColor, start: pos, end: pos }]);
    } else if (tool === 'brush' || tool === 'eraser') {
      setElements([...elements, { ...commonProps, points: [pos.x, pos.y], draggable: false }]);
    }
  };
  
  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastElement = elements[elements.length - 1];
  
    if (tool === 'line') {
      if (lastElement && lastElement.points) {
        // Only update the end point
        lastElement.points = [lastElement.points[0], lastElement.points[1], point.x, point.y];
        elements.splice(elements.length - 1, 1, lastElement);
        setElements([...elements]);
      }
    } else if (tool === 'rectangle' || tool === 'circle') {
      if (lastElement) {
        lastElement.end = point;
        elements.splice(elements.length - 1, 1, lastElement);
        setElements([...elements]);
      }
    } else if (tool === 'brush' || tool === 'eraser') {
      if (lastElement) {
        lastElement.points = [...lastElement.points, point.x, point.y];
        elements.splice(elements.length - 1, 1, lastElement);
        setElements([...elements]);
      }
    }
  };
  
  const handleMouseUp = () => {
    isDrawing.current = false;
    // Push the current state to the undo stack
    setUndoStack([...undoStack, elements]);
    setRedoStack([]); // Clear redo stack on new action
  };

  const handleDragMove = (e, i) => {
    const { x, y } = e.target.position();
    const updatedElements = elements.map((el, index) =>
      index === i ? { ...el, start: { x, y }, end: { x: el.end.x + (x - el.start.x), y: el.end.y + (y - el.start.y) } } : el
    );
    setElements(updatedElements);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setRedoStack([elements, ...redoStack]);
    setElements(lastState);
    setUndoStack(undoStack.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const lastRedo = redoStack[0];
    setUndoStack([...undoStack, elements]);
    setElements(lastRedo);
    setRedoStack(redoStack.slice(1));
  };

  const handleClear = () => {
    setElements([]);
  };

  const generateDesign = async () => {
    const btn = document.getElementById('designBtn');
    btn.innerHTML = 'Generating...';
    btn.disabled = true;
    const uri = stageRef.current.toDataURL();
    const responseImage = await fetchDesign(uri, prompt);
    setLastPrompt(prompt);
    setPrompt('')
    if(responseImage) {
      await handleAddImage(responseImage);
      btn.innerHTML = 'Generate Using AI';
      btn.disabled = false;
    }
  }

  const downloadImage = () => {
    const uri = image.src;
    const link = document.createElement('a');
    link.download = 'design.png';
    link.href = uri;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const refineDesign = async () => {
    const uri = await imageToDataURL(image.src); // Convert image URL to data URL with specific type
    setPromptBar(true);
    const refineBtn = document.getElementById('refineBtn');
    const refinePrompt = document.getElementById('refineInput');
    refineBtn.disabled = true;
    refinePrompt.disabled = true;
    setLastPrompt(refinePrompt);
    setRefinePrompt('');
    setRefineLoading(true);
    const responseImage = await fetchDesign(uri, lastPrompt);
    if (responseImage) {
      setImage(null);
      await handleAddImage(responseImage);
      refineBtn.disabled = false;
      refinePrompt.disabled = false;
      setPromptBar(false);
      setRefineLoading(false);
    }
  }
  
  // Helper function to convert image URL to data URL
  const imageToDataURL = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Ensure the data URL is of type data:image/png;base64
        const base64Data = reader.result.split(',')[1]; // Get the base64 part
        const dataURL = `data:image/png;base64,${base64Data}`;
        resolve(dataURL);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  

  const regenerateDesign = async () => {
    const uri = stageRef.current.toDataURL();
    const regenerateBtn = document.getElementById('regenerateBtn');
    regenerateBtn.disabled = true;
    setRegenerateLoading(true); 
    const responseImage = await fetchDesign(uri, lastPrompt);
    if(responseImage) {
      setImage(null);
      await handleAddImage(responseImage);
      regenerateBtn.disabled = false;
      setRegenerateLoading(false);
  }
}
  
const renderShape = (element, i) => {
  const { tool, color, fill, start, end, strokeWidth, points, draggable } = element;

  switch (tool) {
    case 'rectangle':
      return (
        <Rect
          key={i}
          x={start.x}
          y={start.y}
          width={end.x - start.x}
          height={end.y - start.y}
          stroke={color}
          strokeWidth={strokeWidth}
          draggable={draggable}
          onDragMove={(e) => handleDragMove(e, i)}
          fill={fill} // Add fill property
        />
      );
    case 'circle':
      return (
        <Circle
          key={i}
          x={(start.x + end.x) / 2}
          y={(start.y + end.y) / 2}
          radius={Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          ) / 2}
          stroke={color}
          strokeWidth={strokeWidth}
          draggable={draggable}
          onDragMove={(e) => handleDragMove(e, i)}
          fill={fill} // Add fill property
        />
      );
    case 'line':
      return (
        <Line
          key={i}
          points={points}
          stroke={color}
          strokeWidth={strokeWidth}
          draggable={draggable}
          onDragMove={(e) => handleDragMove(e, i)}
        />
      );
    default:
      return null;
  }
};


  return (
    <section className="flex flex-row h-screen bg-base-100 font-poppins overflow-hidden">
      <SideBar currentPage='designroom' />
      <section className="flex flex-row h-full bg-base-300">
        <div className="flex flex-col p-4 bg-base-100 shadow-md gap-4">
          <div className='mb-4'>
            <h1 className='text-3xl font-bold'>Genesis</h1>
            <h2 className='text-3xl font-light'>DesignRoom</h2>
          </div>
          <h2 className='text-sm font-bold'>Color Picker</h2>
          <div className="flex">
            <CirclePicker color={color} onChangeComplete={(color) => {setColor(color.hex); setFillColor(color.hex)}} width={300}
            colors = {
              ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b", "#000000", "#ffffff" ]
            }
            
            />
          </div>
          <h2 className='text-sm font-bold mt-4'>Basic Tools</h2>

          <div className="flex gap-2 flex-wrap">
            <div className='tooltip' data-tip="Brush tool">
              <button
                onClick={() => setTool('brush')}
                className={`btn ${tool === 'brush' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <i className="fi fi-br-scribble"></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Eraser tool">
              <button
                onClick={() => setTool('eraser')}
                className={`btn ${tool === 'eraser' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <i className="fi fi-br-eraser"></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Rectangle tool">
              <button
                onClick={() => setTool('rectangle')}
                className={`btn ${tool === 'rectangle' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <i className="fi fi-br-rectangle-horizontal"></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Circle tool">
              <button
                onClick={() => setTool('circle')}
                className={`btn ${tool === 'circle' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <i className="fi fi-br-circle"></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Line tool">
              <button
                onClick={() => setTool('line')}
                className={`btn ${tool === 'line' ? 'btn-primary' : 'btn-ghost'}`}
              >
                <i className="fi fi-br-slash"></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Move tool">
              <button
                onClick={() => {setIsDraggingEnabled(!isDraggingEnabled)}}
                className={`btn ${isDraggingEnabled === true ? 'btn-primary' : 'btn-ghost'}`}
              >
                <i className="fi fi-br-arrows"></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Fill tool">
              <button
                onClick={() => {setIsFillEnabled(!isFillEnabled)}}
                className={`btn ${isFillEnabled === true ? 'btn-primary' : 'btn-ghost'}`}
              >
                <i className="fi fi-br-fill"></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Undo">
              <button
                onClick={handleUndo}
                className="btn btn-ghost"
              >
                <i className='fi fi-br-undo'></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Redo">
              <button
                onClick={handleRedo}
                className="btn btn-ghost"
              >
                <i className='fi fi-br-redo'></i>
              </button>
            </div>

            <div className='tooltip' data-tip="Clear">
              <button
                onClick={handleClear}
                className="btn btn-ghost"
              >
                <i className='fi fi-br-trash'></i>
              </button>
            </div>
          
          </div>

          <label className='text-sm font-bold mt-4'>Stroke Width</label>
          <input
            type="range"
            className='range range-primary range-sm'
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            min={1}
            max={100}
            step={1}
          />
        
        <div className='flex flex-col gap-2'>
          <input type="text" placeholder='Enter Prompt here...'
          onChange={(e) => {setPrompt(e.target.value)}}
          value={prompt}
          className='input input-bordered mt-4' />
          <button className='btn btn-primary'
          id="designBtn"
          onClick={generateDesign}
          >
            Generate Using AI
          </button>
        </div>
        
        </div>
        <div className="flex-grow">
          <Stage
            ref={stageRef}
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {elements.map((element, i) =>
                element.tool === 'brush' || element.tool === 'eraser' ? (
                  <Line
                    key={i}
                    points={element.points}
                    stroke={element.tool === 'eraser' ? "#FFF" : element.color}
                    strokeWidth={element.strokeWidth}
                    tension={tension}
                    onDragMove={(e) => handleDragMove(e, i)}
                    lineCap="round"
                    globalCompositeOperation={
                      element.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                  />
                ) : (
                  renderShape(element, i)
                )
              )}
            </Layer>
          </Stage>
        </div>
        {/* Image Panel */}
        {image && (
          <div
            className='flex flex-col gap-4 p-4 bg-base-100 shadow-md h-2/3 absolute bottom-10 right-10 rounded-lg'
          >
          {promptBar && (
            <input type="text"
            onKeyDown={(e) => {if(e.key === 'Enter') {refineDesign()}}}
            className=" w-full input input-bordered input-md absolute -top-14 right-0"
            placeholder='Enter Improvements ...'
            id="refineInput"
            onChange={(e) => {setRefinePrompt(e.target.value)}}
            value={refinePrompt}
            />
          )}
            <div className='flex flex-row justify-between'>
              <h1 className='text-md font-bold mt-2'>Generated Image</h1>

              <div className='flex gap-1'>
              <div className='tooltip' data-tip="Download">
                <button
                className='btn btn-ghost'
                onClick={downloadImage}
                >
                <i className='fi fi-br-download'></i>
                </button>
                </div>

                <div className='tooltip' data-tip="Refine">
                <button
                id = "refineBtn"
                className='btn btn-ghost'
                onClick={() => {setPromptBar(true)}}
                >
                <i className={`fi fi-br-magic-wand ${refineLoading === true ? ' animate-pulse':''}`}></i>
                </button>
                </div>

                <div className='tooltip' data-tip="Regenerate">
                <button
                id="regenerateBtn"
                className='btn btn-ghost'
                onClick={regenerateDesign}
                >{regenerateLoading ? 
                <i className='fi fi br-spin fi-br-spinner animate-spin'></i>
                :
                <i className='fi fi-br-rotate-right'></i>
                }
                </button>
                </div>
              {/* Close Button */}
              <button
                className='btn btn-ghost'
                onClick={() => setImage(null)}
                >
                <i className='fi fi-br-cross'></i>
                </button>

              </div>
                
            </div>
            <img src={image.src} alt="Generated" width="400" />
          </div>
        )}
      </section>
    </section>
  );
};


export default GraphicDesignTool;
