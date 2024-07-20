import React, { useState, useRef } from 'react';
import { SketchPicker } from 'react-color';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';

const GraphicDesignTool = () => {
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000');
  const [elements, setElements] = useState([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    if (tool === 'rectangle' || tool === 'circle') {
      setElements([...elements, { tool, color, start: pos, end: pos }]);
    } else {
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
    } else {
      lastElement.points = lastElement.points.concat([point.x, point.y]);
    }
    elements.splice(elements.length - 1, 1, lastElement);
    setElements(elements.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

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
            strokeWidth={2}
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
            strokeWidth={2}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-row h-screen bg-gray-100">
      <div className="flex flex-col p-4 bg-white shadow-md justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setTool('brush')}
            className={`p-2 rounded ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Brush
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Eraser
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-2 rounded ${tool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Rectangle
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded ${tool === 'circle' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Circle
          </button>
        </div>
        <div className="flex items-center">
          <SketchPicker color={color} onChangeComplete={(color) => setColor(color.hex)} />
        </div>
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
                  strokeWidth={5}
                  tension={0.5}
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
    </div>
  );
};

export default GraphicDesignTool;
