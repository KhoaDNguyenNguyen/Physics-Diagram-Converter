import React, { useRef, useEffect, useState } from 'react';
import { 
    TrashIcon, TypeIcon, RotateIcon, FlipHorizontalIcon, FlipVerticalIcon, 
    LineIcon, RectangleIcon, SelectIcon, PencilIcon, EllipseIcon, PaletteIcon 
} from './icons/Icons';
import { DiagramComponent, ComponentType } from '../types';

declare const fabric: any;
declare const MathJax: any;

type Tool = 'select' | 'pencil' | 'line' | 'rectangle' | 'ellipse' | 'text';

interface InteractiveSvgEditorProps {
  components: DiagramComponent[];
  onComponentsChange: (value: React.SetStateAction<DiagramComponent[] | null>) => void;
}

const fabricTypeToComponentType = (fabricType: string): ComponentType => {
    switch(fabricType?.toLowerCase()) {
        case 'rect': return ComponentType.RECT;
        case 'ellipse': return ComponentType.ELLIPSE;
        case 'path': return ComponentType.PATH;
        case 'i-text': return ComponentType.TEXT;
        case 'group': return ComponentType.GROUP;
        default: return ComponentType.RECT; 
    }
};

const InteractiveSvgEditor: React.FC<InteractiveSvgEditorProps> = ({ components, onComponentsChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  
  const onComponentsChangeRef = useRef(onComponentsChange);
  useEffect(() => {
    onComponentsChangeRef.current = onComponentsChange;
  }, [onComponentsChange]);
  
  const [activeObject, setActiveObject] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTextInputOpen, setIsTextInputOpen] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  
  const [toolProps, setToolProps] = useState({
    stroke: '#212121',
    strokeWidth: 2,
    fill: 'transparent',
  });

  const activeToolRef = useRef(activeTool);
  const toolPropsRef = useRef(toolProps);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{x: number, y: number} | null>(null);
  const drawingObjectRef = useRef<any>(null);
  const textPlacementCoordsRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    toolPropsRef.current = toolProps;
  }, [toolProps]);

  const updateStateFromCanvasObject = (canvasObj: any) => {
    if (!canvasObj || !canvasObj.id) return;
    
    onComponentsChangeRef.current(prevComponents => {
      if (!prevComponents) return null;
      return prevComponents.map(comp => {
        if (comp.id === canvasObj.id) {
          const componentType = fabricTypeToComponentType(canvasObj.type);
          const newComp: DiagramComponent = {
              ...comp,
              id: canvasObj.id,
              type: componentType,
              x: canvasObj.left,
              y: canvasObj.top,
              width: canvasObj.width * (canvasObj.scaleX || 1),
              height: canvasObj.height * (canvasObj.scaleY || 1),
              scaleX: 1, 
              scaleY: 1,
              rotation: canvasObj.angle,
              fill: canvasObj.get('fill'),
              stroke: canvasObj.stroke,
              strokeWidth: canvasObj.strokeWidth,
              text: componentType === ComponentType.TEXT ? canvasObj.text : comp.text,
              path: componentType === ComponentType.PATH ? fabric.util.joinPath(canvasObj.path) : comp.path,
          };
          return newComp;
        }
        return comp;
      });
    });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
        width: 500,
        height: 400,
        backgroundColor: '#ffffff',
    });
    fabricCanvasRef.current = canvas;
    
    const onModified = (options: any) => {
      const modifiedObj = options.target;
      if(modifiedObj) {
          updateStateFromCanvasObject(modifiedObj);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject()) {
        deleteActiveObject();
      }
    };
    
    const onMouseDown = (o: any) => {
      const currentTool = activeToolRef.current;
      const currentToolProps = toolPropsRef.current;
      const pointer = canvas.getPointer(o.e);

      if (currentTool === 'text') {
        textPlacementCoordsRef.current = { x: pointer.x, y: pointer.y };
        setTextInputValue('');
        setIsTextInputOpen(true);
        return;
      }
      
      if (currentTool === 'select' || currentTool === 'pencil') return;
      
      isDrawingRef.current = true;
      startPointRef.current = { x: pointer.x, y: pointer.y };
      
      let shape;
      const shapeOptions = {
          left: pointer.x, top: pointer.y,
          stroke: currentToolProps.stroke, strokeWidth: currentToolProps.strokeWidth, fill: currentToolProps.fill,
          originX: 'left', originY: 'top', selectable: false
      };

      switch(currentTool) {
        case 'line':
            shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], { ...shapeOptions, stroke: currentToolProps.stroke });
            break;
        case 'rectangle':
            shape = new fabric.Rect({...shapeOptions, width: 0, height: 0 });
            break;
        case 'ellipse':
            shape = new fabric.Ellipse({...shapeOptions, rx: 0, ry: 0 });
            break;
        default: return;
      }
      drawingObjectRef.current = shape;
      canvas.add(shape);
    };

    const onMouseMove = (o: any) => {
      if (!isDrawingRef.current) return;
      const pointer = canvas.getPointer(o.e);
      const start = startPointRef.current!;
      const shape = drawingObjectRef.current;
      if (!shape) return;

      const currentTool = activeToolRef.current;

      let left = Math.min(pointer.x, start.x);
      let top = Math.min(pointer.y, start.y);
      let width = Math.abs(pointer.x - start.x);
      let height = Math.abs(pointer.y - start.y);

      switch(currentTool) {
        case 'line':
            shape.set({ x2: pointer.x, y2: pointer.y });
            break;
        case 'rectangle':
            shape.set({ left, top, width, height });
            break;
        case 'ellipse':
            shape.set({ left, top, rx: width / 2, ry: height / 2 });
            break;
      }
      canvas.renderAll();
    };

    const onMouseUp = () => {
      if (!isDrawingRef.current) return;
      const shape = drawingObjectRef.current;
      const currentTool = activeToolRef.current;
      isDrawingRef.current = false;
      drawingObjectRef.current = null;
      startPointRef.current = null;
      
      canvas.remove(shape);

      if (!shape || (shape.width < 2 && shape.height < 2 && currentTool !== 'line') || (currentTool === 'line' && Math.abs(shape.x1 - shape.x2) < 2 && Math.abs(shape.y1 - shape.y2) < 2)) {
          return;
      }
      
      let newComponent: DiagramComponent;
      const commonProps = {
          id: `${currentTool}-${Date.now()}`,
          rotation: 0, scaleX: 1, scaleY: 1,
          fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth
      };

      switch(currentTool) {
          case 'line':
              newComponent = {
                  ...commonProps, type: ComponentType.PATH,
                  path: `M ${shape.x1} ${shape.y1} L ${shape.x2} ${shape.y2}`,
                  x: Math.min(shape.x1, shape.x2), y: Math.min(shape.y1, shape.y2),
                  width: Math.abs(shape.x1 - shape.x2), height: Math.abs(shape.y1 - shape.y2),
                  fill: 'transparent'
              };
              break;
          case 'rectangle':
              newComponent = {
                  ...commonProps, type: ComponentType.RECT,
                  x: shape.left, y: shape.top, width: shape.width, height: shape.height,
              };
              break;
          case 'ellipse':
              newComponent = {
                  ...commonProps, type: ComponentType.ELLIPSE,
                  x: shape.left, y: shape.top, width: shape.rx * 2, height: shape.ry * 2,
              };
              break;
          default: return;
      }
      
      onComponentsChangeRef.current(prev => [...(prev || []), newComponent]);
      setActiveTool('select');
    };

    const onPathCreated = (e: any) => {
        const newPath = e.path;
        const currentToolProps = toolPropsRef.current;
        newPath.set({
            stroke: currentToolProps.stroke,
            strokeWidth: currentToolProps.strokeWidth,
            fill: 'transparent',
            selectable: false,
        });
        const newComponent: DiagramComponent = {
            id: `path-${Date.now()}`, type: ComponentType.PATH,
            path: fabric.util.joinPath(newPath.path),
            x: newPath.left, y: newPath.top,
            width: newPath.width, height: newPath.height,
            rotation: 0, fill: newPath.fill, stroke: newPath.stroke, strokeWidth: newPath.strokeWidth,
            scaleX: 1, scaleY: 1
        };
        onComponentsChangeRef.current(prev => [...(prev || []), newComponent]);
        canvas.remove(newPath);
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('path:created', onPathCreated);
    canvas.on('selection:created', (e:any) => setActiveObject(e.target));
    canvas.on('selection:updated', (e:any) => setActiveObject(e.target));
    canvas.on('selection:cleared', () => setActiveObject(null));
    canvas.on('object:modified', onModified);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.off();
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'pencil';
    canvas.selection = activeTool === 'select';
    canvas.defaultCursor = activeTool === 'select' ? 'default' : 'crosshair';
    canvas.getObjects().forEach((obj:any) => obj.set('selectable', activeTool === 'select'));

    if (activeTool === 'pencil') {
        canvas.freeDrawingBrush.color = toolProps.stroke;
        canvas.freeDrawingBrush.width = toolProps.strokeWidth;
    }
  }, [activeTool, toolProps]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !components) return;
    
    if (isDrawingRef.current) return;

    const currentlySelectedId = canvas.getActiveObject()?.id;
    
    const createFabricObject = (comp: DiagramComponent): Promise<any> => {
      return new Promise(async (resolve, reject) => {
        try {
          const options = { id: comp.id, left: comp.x, top: comp.y, angle: comp.rotation, fill: comp.fill, stroke: comp.stroke, strokeWidth: comp.strokeWidth, originX: 'left', originY: 'top', scaleX: comp.scaleX || 1, scaleY: comp.scaleY || 1 };
          
          let obj;
          switch(comp.type) {
              case ComponentType.RECT:
                  obj = new fabric.Rect({...options, width: comp.width, height: comp.height});
                  break;
              case ComponentType.ELLIPSE:
                  obj = new fabric.Ellipse({...options, rx: comp.width / 2, ry: comp.height / 2 });
                  break;
              case ComponentType.TEXT:
                  obj = new fabric.IText(comp.text || '', {...options, fontSize: comp.height });
                  break;
              case ComponentType.PATH:
                  obj = new fabric.Path(comp.path, {...options, width: comp.width, height: comp.height});
                  break;
              case ComponentType.GROUP:
                  if (comp.svgString) {
                    fabric.loadSVGFromString(comp.svgString, (objects: any[], svgOptions: any) => {
                      if (!objects) {
                        return reject(new Error(`Failed to load SVG string for component ID: ${comp.id}`));
                      }
                       const group = new fabric.Group(objects, { ...options, width: svgOptions.width, height: svgOptions.height });
                       resolve(group);
                    });
                    return;
                  }
                  break;
          }
          resolve(obj);
        } catch (error) {
          reject(error);
        }
      });
    };
    
    const renderCanvas = async () => {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';

      const objectPromises = components.map(comp => 
        createFabricObject(comp).catch(error => {
          console.error(`Could not render component "${comp.id}":`, error);
          return null;
        })
      );
      
      const fabricObjects = (await Promise.all(objectPromises)).filter(Boolean);
      
      fabricObjects.forEach(obj => {
        if (obj) {
          obj.set('selectable', activeToolRef.current === 'select');
          canvas.add(obj);
        }
      });

      const newSelection = canvas.getObjects().find((obj: any) => obj.id === currentlySelectedId);
      if(newSelection){
          canvas.setActiveObject(newSelection);
      }
      canvas.renderAll();
    };

    renderCanvas();
  }, [components]);
  
  const handleAddTextFromModal = async () => {
      const input = textInputValue.trim();
      const coords = textPlacementCoordsRef.current;
      setIsTextInputOpen(false);
      setTextInputValue('');
  
      if (!input || !coords) {
          return;
      }
  
      const isLatex = /\\|[\^_]/.test(input) || (input.startsWith('$') && input.endsWith('$'));
  
      if (isLatex) {
          try {
              // REFACTOR: Complete "SVG Flattening" to fix the cloneNode error permanently.
              const svgNode = await MathJax.tex2svgPromise(input, { display: false });
              const rawSvgElement = svgNode.querySelector('svg');
              if (!rawSvgElement) throw new Error("MathJax did not produce a valid SVG element.");

              const rawSvgText = new XMLSerializer().serializeToString(rawSvgElement);
              const parser = new DOMParser();
              const doc = parser.parseFromString(rawSvgText, 'image/svg+xml');
              const svgRoot = doc.documentElement;

              // Step 1: Inline all <use> tags, which is the primary cause of Fabric.js parser failure.
              const defs = svgRoot.querySelector('defs');
              if (defs) {
                  const useElements = Array.from(svgRoot.querySelectorAll('use'));
                  for (const useEl of useElements) {
                      const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
                      if (!href || !href.startsWith('#')) continue;

                      const defId = href.substring(1);
                      const defEl = defs.querySelector(`#${defId}`);

                      if (defEl) {
                          const clonedDef = defEl.cloneNode(true) as SVGElement;
                          
                          // Create a <g> wrapper to apply the <use> tag's transforms.
                          const gWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                          ['transform', 'x', 'y'].forEach(attr => {
                              if (useEl.hasAttribute(attr)) {
                                  gWrapper.setAttribute(attr, useEl.getAttribute(attr)!);
                              }
                          });

                          // Move children of the definition into the wrapper.
                          while (clonedDef.firstChild) {
                            gWrapper.appendChild(clonedDef.firstChild);
                          }
                          
                          useEl.parentNode?.replaceChild(gWrapper, useEl);
                      }
                  }
                  // Step 2: Remove the <defs> block as it's no longer needed.
                  defs.remove();
              }
              
              // Step 3: Final sanitization for maximum compatibility.
              const defaultColor = '#000000';
              svgRoot.querySelectorAll('*').forEach((el: Element) => {
                  el.removeAttribute('style');
                  el.removeAttribute('class');
                  if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
                      el.setAttribute('fill', defaultColor);
                  }
                  if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                      el.setAttribute('stroke', defaultColor);
                  }
              });

              const viewBoxAttr = svgRoot.getAttribute('viewBox');
              if (!viewBoxAttr) throw new Error("SVG is missing viewBox attribute.");
              const viewBox = viewBoxAttr.split(' ').map(Number);
              const width = viewBox[2];
              const height = viewBox[3];

              svgRoot.setAttribute('width', String(width));
              svgRoot.setAttribute('height', String(height));

              // Step 4: Serialize the fully processed, flattened SVG to a string.
              const svgString = new XMLSerializer().serializeToString(svgRoot);

              const newFormulaComponent: DiagramComponent = {
                  id: `latex-${Date.now()}`, type: ComponentType.GROUP, svgString,
                  x: coords.x, y: coords.y, width, height,
                  scaleX: 1, scaleY: 1, rotation: 0,
                  fill: toolPropsRef.current.stroke, // This color will be applied by Fabric.js
                  stroke: 'transparent', strokeWidth: 0,
              };
              onComponentsChangeRef.current(prev => [...(prev || []), newFormulaComponent]);

          } catch (err) {
              console.error("LaTeX rendering refactor error:", err);
              alert(`Failed to render LaTeX formula. Error: ${err instanceof Error ? err.message : String(err)}`);
          }
      } else {
          // Plain text logic remains the same
          const newTextComponent: DiagramComponent = {
              id: `text-${Date.now()}`, type: ComponentType.TEXT, text: input,
              x: coords.x, y: coords.y, width: input.length * 12, height: 24,
              scaleX: 1, scaleY: 1, rotation: 0,
              fill: toolPropsRef.current.stroke, stroke: 'transparent', strokeWidth: 0,
          };
          onComponentsChangeRef.current(prev => [...(prev || []), newTextComponent]);
      }
      setActiveTool('select');
  };
  
  const deleteActiveObject = () => {
    const canvas = fabricCanvasRef.current;
    const target = canvas.getActiveObject();
    if (!canvas || !target) return;
    canvas.remove(target);
    onComponentsChangeRef.current(prev => prev ? prev.filter(c => c.id !== target.id) : null);
    setActiveObject(null);
  };
  
  const updateActiveObjectProperty = (prop: string, value: any) => {
    const canvas = fabricCanvasRef.current;
    const target = canvas.getActiveObject();
    if (!canvas || !target) return;
    target.set(prop, value).setCoords();
    canvas.renderAll();
    updateStateFromCanvasObject(target);
  }

  const handleFlip = (axis: 'X' | 'Y') => {
    const prop = `flip${axis}`;
    const target = fabricCanvasRef.current?.getActiveObject();
    if (target) {
        updateActiveObjectProperty(prop, !target[prop]);
    }
  };
  
  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setIsPaletteOpen(false);
  }

  const ToolButton = ({ tool, label, children }: { tool: Tool; label: string; children: React.ReactNode }) => (
    <button onClick={() => handleToolSelect(tool)} className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 w-full ${activeTool === tool ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-base-200'}`} title={label}>
        {children}
        <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <>
    {isTextInputOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Add Text or Formula</h3>
                <p className="text-sm text-gray-500 mb-4">Enter plain text or a LaTeX formula (e.g., `F = m \cdot a`).</p>
                <textarea
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                    rows={3}
                    placeholder="Type here..."
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setIsTextInputOpen(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddTextFromModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    )}
    <div className="flex flex-col w-full h-full gap-2">
        <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300 shadow-sm flex-wrap">
             <div className="relative">
                <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="p-2 rounded-lg hover:bg-base-200" title="Tools">
                    <PaletteIcon />
                </button>
                {isPaletteOpen && (
                    <div className="absolute z-10 top-full mt-2 w-60 bg-base-100 rounded-lg shadow-xl border border-base-300 p-2 grid grid-cols-3 gap-1">
                        <ToolButton tool="select" label="Select"><SelectIcon /></ToolButton>
                        <ToolButton tool="pencil" label="Pencil"><PencilIcon /></ToolButton>
                        <ToolButton tool="line" label="Line"><LineIcon /></ToolButton>
                        <ToolButton tool="rectangle" label="Rect"><RectangleIcon /></ToolButton>
                        <ToolButton tool="ellipse" label="Ellipse"><EllipseIcon /></ToolButton>
                        <ToolButton tool="text" label="Text"><TypeIcon /></ToolButton>
                    </div>
                )}
            </div>
             <div className="flex items-center gap-4 flex-grow border-l border-base-300 pl-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="stroke-color" className="text-sm font-medium text-gray-700">Stroke</label>
                    <div className="relative w-8 h-8 rounded-md border-2 border-gray-300 overflow-hidden cursor-pointer" style={{backgroundColor: toolProps.stroke}}>
                      <input id="stroke-color" type="color" value={toolProps.stroke} onChange={e => setToolProps(p => ({...p, stroke: e.target.value}))} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="fill-color" className="text-sm font-medium text-gray-700">Fill</label>
                    <div className="relative w-8 h-8 rounded-md border-2 border-gray-300 overflow-hidden cursor-pointer" style={{backgroundColor: toolProps.fill}}>
                      <input id="fill-color" type="color" value={toolProps.fill} onChange={e => setToolProps(p => ({...p, fill: e.target.value}))} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="stroke-width" className="text-sm font-medium text-gray-700">Width</label>
                    <input id="stroke-width" type="number" min="1" max="50" value={toolProps.strokeWidth} onChange={e => setToolProps(p => ({...p, strokeWidth: parseInt(e.target.value, 10) || 1}))} className="w-16 px-2 py-1 text-center bg-gray-100 border-gray-300 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col md:flex-row gap-4">
            <div className="flex-grow w-full h-full overflow-hidden border border-base-300 rounded-lg flex items-center justify-center bg-grid">
                <canvas ref={canvasRef} />
                 <style>{`.bg-grid { background-color: #f8fafc; background-image: linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px); background-size: 20px 20px; }`}</style>
            </div>
            
            {activeTool === 'select' && activeObject && (
            <div className="w-full md:w-64 bg-base-100 p-4 rounded-lg shadow-sm border border-base-300 flex-shrink-0">
                <h3 className="font-semibold mb-4 border-b pb-2">Properties</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Fill Color</label>
                        <input type="color" onChange={(e) => updateActiveObjectProperty('fill', e.target.value)} value={typeof activeObject?.get('fill') === 'string' ? activeObject.get('fill') : '#000000'} className="w-full h-10 p-1 border-base-300 border rounded-md cursor-pointer" title="Change Fill Color"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Rotation</label>
                        <div className="flex items-center gap-2">
                            <RotateIcon />
                            <input type="range" min="-180" max="180" step="1" value={Math.round(activeObject.angle)} onChange={(e) => updateActiveObjectProperty('angle', parseInt(e.target.value, 10))} className="w-full"/>
                            <span className="text-sm w-12 text-center">{Math.round(activeObject.angle)}°</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Actions</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleFlip('X')} className="p-2 rounded hover:bg-base-200 border border-base-300 flex items-center justify-center" title="Flip Horizontal">
                                <FlipHorizontalIcon />
                            </button>
                            <button onClick={() => handleFlip('Y')} className="p-2 rounded hover:bg-base-200 border border-base-300 flex items-center justify-center" title="Flip Vertical">
                                <FlipVerticalIcon />
                            </button>
                             <button onClick={deleteActiveObject} className="p-2 rounded text-red-600 hover:bg-red-100 border border-base-300 flex items-center justify-center" title="Delete (Del)">
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    </div>
    </>
  );
};

export default InteractiveSvgEditor;
