// src/components/Whiteboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import io from 'socket.io-client';
import './Whiteboard.scss';

const socket = io('http://localhost:4000'); // Change to your server address

const Whiteboard: React.FC = () => {
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const [color, setColor] = useState('black');
    const [brushSize, setBrushSize] = useState(5);
    const [history, setHistory] = useState<any[]>([]);
    const [redoStack, setRedoStack] = useState<any[]>([]);
    const [width, setWidth] = useState(2 * window.innerWidth);
    const [height, setHeight] = useState(2 * window.outerHeight);

    useEffect(() => {
        const canvas = new fabric.Canvas('whiteboard', {
            isDrawingMode: true,
            width: width,
            height: height
        });
        canvasRef.current = canvas;
    
        socket.on('drawing', (data) => {
            canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
        });
    
        canvas.on('path:created', () => {
            const state = JSON.stringify(canvas);
            setHistory((prevHistory) => [...prevHistory, state]);
            setRedoStack([]);
            socket.emit('drawing', state);
        });
    
        return () => {
            canvas.dispose();
            socket.disconnect();
        };
    }, [width, height]);

    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.freeDrawingBrush.color = color;
        }
    }, [color]);
    
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.freeDrawingBrush.width = brushSize;
        }
    }, [brushSize]);

    // prevent double click on whiteboard-container
    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
    };
    
    useEffect(() => {
        window.document.querySelector('#whiteboard-container')?.addEventListener('dblclick', handleDoubleClick as unknown as EventListener);
    }, []);

    const handleUndo = () => {
        if (history.length > 0) {
            const lastState = history.pop();
            setRedoStack((prevRedoStack) => [...prevRedoStack, lastState]);
            const previousState = history[history.length - 1] || {};
            canvasRef.current?.loadFromJSON(previousState, canvasRef.current.renderAll.bind(canvasRef.current));
            socket.emit('drawing', previousState);
        }
    };

    const handleRedo = () => {
        if (redoStack.length > 0) {
            const redoState = redoStack.pop();
            setHistory((prevHistory) => [...prevHistory, redoState]);
            canvasRef.current?.loadFromJSON(redoState, canvasRef.current.renderAll.bind(canvasRef.current));
            socket.emit('drawing', redoState);
        }
    };

    const handleClosePopUp = () => {
        const pop_up = document.querySelector('.pop-up') as HTMLDivElement | null;
        if (pop_up && !pop_up.classList.contains('hidden')) {
            pop_up.classList.add('hidden');
        }
    }

    const handleShowPopup = () => {
        // show image save options
        const pop_up = document.querySelector('.pop-up') as HTMLDivElement | null;
        if (pop_up && pop_up.classList.contains('hidden')) {
            pop_up.classList.remove('hidden');
        }
    };

    const handleSaveAsPNG = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1.0,
            });
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'whiteboard.png';
            link.click();
        }
        handleClosePopUp();
    }

    const handleSaveAsJPG = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.backgroundColor = 'white'; // Set white background color
            const dataURL = canvas.toDataURL({
            format: 'jpeg',
            quality: 1.0,
            });
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'whiteboard.jpg';
            link.click();
        }
        handleClosePopUp();
    }

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setColor(e.target.value);
    };

    const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBrushSize(parseInt(e.target.value, 10));
    };

    const toggleBrushSizeInput = () => {
        const brushSizeInput = document.querySelector('.brush-size input[type="range"]') as HTMLInputElement | null;
        if (brushSizeInput) {
            if (brushSizeInput.style.display === 'flex') {
                brushSizeInput.style.display = 'none';
            } else {
                brushSizeInput.style.display = 'flex';
            }
        }
    }

    return (
        <div id='whiteboard-container'>
            <div className="toolbar">
                <div className="color-options">
                    <button title='black' onClick={() => setColor('black')} type='button' style={{ backgroundColor: 'black' }}></button>
                    <button title='red' onClick={() => setColor('red')} type='button' style={{ backgroundColor: 'red' }}></button>
                    <button title='blue' onClick={() => setColor('blue')} type='button' style={{ backgroundColor: 'blue' }}></button>
                    <button title='green' onClick={() => setColor('green')} type='button' style={{ backgroundColor: 'green' }}></button>
                    <button title='yellow' onClick={() => setColor('yellow')} type='button' style={{ backgroundColor: 'yellow' }}></button>
                    <button title='gray' onClick={() => setColor('gray')} type='button' style={{ backgroundColor: 'gray' }}></button>
                    {/* Custom Color Picker */}
                    <input title='Custom' type="color" value={color} onChange={handleColorChange} className='custom-color-picker' />
                </div>
                <div className="brush-size" title='Brush Size'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none" onClick={toggleBrushSizeInput}>
                        <path d="M15.6287 5.12132L4.31497 16.435M15.6287 5.12132L19.1642 8.65685M15.6287 5.12132L17.0429 3.70711C17.4334 3.31658 18.0666 3.31658 18.4571 3.70711L20.5784 5.82843C20.969 6.21895 20.969 6.85212 20.5784 7.24264L19.1642 8.65685M7.85051 19.9706L4.31497 16.435M7.85051 19.9706L19.1642 8.65685M7.85051 19.9706L3.25431 21.0312L4.31497 16.435" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <input title='Brush Size' type="range" min="1" max="100" value={brushSize} onChange={handleBrushSizeChange} />
                </div>
            </div>
            <div className="undo-redo-btns">
                <svg className="undo-btn" width="80px" height="80px" viewBox="0 0 24 24" fill="none" onClick={handleUndo} transform="matrix(-1, 0, 0, 1, 0, 0)">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
                    <g id="SVGRepo_iconCarrier"> 
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.2929 3.29289C15.6834 2.90237 16.3166 2.90237 16.7071 3.29289L21.4142 8L16.7071 12.7071C16.3166 13.0976 15.6834 13.0976 15.2929 12.7071C14.9024 12.3166 14.9024 11.6834 15.2929 11.2929L17.5858 9H10C7.23858 9 5 11.2386 5 14C5 16.7614 7.23857 19 10 19H15.8462C16.3984 19 16.8462 19.4477 16.8462 20C16.8462 20.5523 16.3984 21 15.8462 21H10C6.134 21 3 17.866 3 14C3 10.134 6.13401 7 10 7H17.5858L15.2929 4.70711C14.9024 4.31658 14.9024 3.68342 15.2929 3.29289Z" fill="#0F1729"/>
                    </g>
                </svg>
                <svg className="redo-btn" width="80px" height="80px" viewBox="0 0 24 24" fill="none" onClick={handleRedo}>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.2929 3.29289C15.6834 2.90237 16.3166 2.90237 16.7071 3.29289L21.4142 8L16.7071 12.7071C16.3166 13.0976 15.6834 13.0976 15.2929 12.7071C14.9024 12.3166 14.9024 11.6834 15.2929 11.2929L17.5858 9H10C7.23858 9 5 11.2386 5 14C5 16.7614 7.23857 19 10 19H15.8462C16.3984 19 16.8462 19.4477 16.8462 20C16.8462 20.5523 16.3984 21 15.8462 21H10C6.134 21 3 17.866 3 14C3 10.134 6.13401 7 10 7H17.5858L15.2929 4.70711C14.9024 4.31658 14.9024 3.68342 15.2929 3.29289Z"/>
                </svg>
            </div>
            <button type='button' className='save-btn' onClick={handleShowPopup}>Download Image</button>
            <div className="Canvas-Container">
                <canvas id="whiteboard" width={width} height={height}></canvas>
            </div>
            <div className="pop-up hidden">
                <button className="close-btn" onClick={handleClosePopUp} type="button">
                    X
                </button>
                <h3>Save Image As:</h3>
                <div className="image-save-options">
                    <button onClick={handleSaveAsPNG}>PNG</button>
                    <button onClick={handleSaveAsJPG}>JPG</button>
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;
