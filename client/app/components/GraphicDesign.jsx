import React, { useState, useRef } from 'react';
import { CirclePicker } from 'react-color';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import SideBar from './SideBar';

const GraphicDesignTool = () => {
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [tension, setTension] = useState(0.5);
  const [elements, setElements] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    if (tool === 'rectangle' || tool === 'circle') {
      setElements([...elements, { tool, color, start: pos, end: pos }]);
    } else if (tool === 'brush' || tool === 'eraser') {
      setElements([...elements, { tool, color, points: [pos.x, pos.y] }]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastElement = elements[elements.length - 1];
    if (tool === 'rectangle' || tool === 'circle') {
      lastElement.end = point;
    } else if (tool === 'brush' || tool === 'eraser') {
      lastElement.points = lastElement.points.concat([point.x, point.y]);
    }
    elements.splice(elements.length - 1, 1, lastElement);
    setElements(elements.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    // Push the current state to the undo stack
    setUndoStack([...undoStack, elements]);
    setRedoStack([]); // Clear redo stack on new action
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
  }

  const renderShape = (element, i) => {
    const { tool, color, start, end } = element;

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
          />
        );  
      case 'line':
        return (
          <Line
            key={i}
            points={[start.x, start.y, end.x, end.y]}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="flex flex-row h-screen bg-base-100 font-poppins">
    <SideBar />
    <section className="flex flex-row h-screen bg-gray-100 font-poppins">
      <div className="flex flex-col p-4 bg-base-100 shadow-md gap-4">
        <h2 className='text-sm'>Color Picker</h2>
        <div className="flex">
          <CirclePicker color={color} onChangeComplete={(color) => setColor(color.hex)} />
        </div>
        <h2 className='text-sm'>Basic Tools</h2>
        <div className="flex gap-2 flex-wrap">
          <div className='tooltip' data-tip="Brush tool">
          <button
            onClick={() => setTool('brush')}
            className={`btn ${tool === 'brush' ? ' btn-primary' : ' btn-ghost'}`}
          >
          <i className="fi fi-br-scribble"></i>
          </button>
          </div>

          <div className='tooltip' data-tip="Eraser tool">
          <button
            onClick={() => setTool('eraser')}
            className={`btn ${tool === 'eraser' ? ' btn-primary' : ' btn-ghost'}`}
          >
            <i className="fi fi-br-eraser"></i>
          </button>
          </div>

          <div className='tooltip' data-tip="Rectangle tool">
          <button
            onClick={() => setTool('rectangle')}
            className={`btn ${tool === 'rectangle' ? ' btn-primary' : ' btn-ghost'}`}
          >
            <i className="fi fi-br-rectangle-horizontal"></i>
          </button>
          </div>

          <div className='tooltip' data-tip="Circle tool">
          <button
            onClick={() => setTool('circle')}
            className={`btn ${tool === 'circle' ? ' btn-primary' : ' btn-ghost'}`}
          >
            <i className="fi fi-br-circle"></i>
          </button>
          </div>

          <div className='tooltip' data-tip="Line tool">
          <button
            onClick={() => setTool('line')}
            className={`btn ${tool === 'line' ? ' btn-primary' : ' btn-ghost'}`}
          >
            <i className="fi fi-br-slash"></i>
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

        <label className='text-sm'>Stroke Width</label>
        <input type="range" 
          className='range range-primary range-sm'
          value={strokeWidth} onChange={(e) => setStrokeWidth(e.target.value)} />
    
      </div>
      <div className="flex-grow">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight - 100}
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
                  stroke={element.tool === 'eraser' ? '#FFF' : element.color}
                  strokeWidth={strokeWidth}
                  tension={tension}
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
    </section>
    </section>
  );
};

export default GraphicDesignTool;
