import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function App() {
  const [images, setImages] = useState([]);
  const [shape, setShape] = useState('hexagon');

  const sensors = useSensors(useSensor(PointerSensor));

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      src: URL.createObjectURL(file),
      rotation: 0,
      scale: 1,
      filter: 'none',
      offsetX: 0,
      offsetY: 0,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex(img => img.id === active.id);
    const newIndex = images.findIndex(img => img.id === over.id);
    setImages((items) => arrayMove(items, oldIndex, newIndex));
  };

  const getClipPath = () => {
    switch (shape) {
      case 'hexagon':
        return 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)';
      case 'circle':
        return 'circle(50% at 50% 50%)';
      case 'triangle':
        return 'polygon(50% 0%, 0% 100%, 100% 100%)';
      default:
        return 'none';
    }
  };

  const updateImage = (id, changes) => {
    setImages(images.map(img =>
      img.id === id ? { ...img, ...changes } : img
    ));
  };

  const resetImage = (id) => {
    setImages(images.map(img =>
      img.id === id ? {
        ...img,
        rotation: 0,
        scale: 1,
        filter: 'none',
        offsetX: 0,
        offsetY: 0
      } : img
    ));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>📸 PhotoGrid Web App</h1>

      <label>
        Shape:
        <select value={shape} onChange={(e) => setShape(e.target.value)} style={{ marginLeft: '0.5rem' }}>
          <option value="hexagon">Hexagon</option>
          <option value="circle">Circle</option>
          <option value="triangle">Triangle</option>
          <option value="square">Square</option>
        </select>
      </label>

      <input type="file" multiple accept="image/*" onChange={handleUpload} style={{ display: 'block', marginTop: '1rem' }} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            {images.map((img) => (
              <SortableImage
                key={img.id}
                image={img}
                clipPath={getClipPath()}
                updateImage={updateImage}
                resetImage={resetImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableImage({ image, clipPath, updateImage, resetImage }) {
  const {
    attributes, listeners, setNodeRef, transform, transition
  } = useSortable({ id: image.id });

  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    setDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    e.stopPropagation();
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    setStartPos({ x: e.clientX, y: e.clientY });
    updateImage(image.id, {
      offsetX: image.offsetX + dx,
      offsetY: image.offsetY + dy,
    });
  };

  const onMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  });

  const wrapperStyle = {
    clipPath,
    width: '100%',
    height: '150px',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '10px',
    background: '#ddd',
    cursor: 'grab'
  };

  const imageStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    transform: `translate(${image.offsetX}px, ${image.offsetY}px) rotate(${image.rotation}deg) scale(${image.scale})`,
    transition,
    filter: image.filter,
    userSelect: 'none'
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ position: 'relative' }}>
      <div style={wrapperStyle}>
        <img
          ref={dragRef}
          src={image.src}
          alt="grid-img"
          style={imageStyle}
          onMouseDown={onMouseDown}
        />
      </div>
      <div style={{ marginTop: '0.3rem' }}>
        <button onClick={() => updateImage(image.id, { rotation: image.rotation + 15 })}>⤴ Rotate</button>
        <button onClick={() => updateImage(image.id, { scale: image.scale + 0.1 })}>➕ Zoom</button>
        <button onClick={() => updateImage(image.id, { scale: Math.max(0.5, image.scale - 0.1) })}>➖ Zoom</button>
        <button onClick={() => updateImage(image.id, { filter: 'grayscale(1)' })}>🌑 Gray</button>
        <button onClick={() => updateImage(image.id, { filter: 'sepia(1)' })}>🟤 Sepia</button>
        <button onClick={() => updateImage(image.id, { filter: 'brightness(1.5)' })}>☀️ Bright</button>
        <button onClick={() => resetImage(image.id)}>♻️ Reset</button>
      </div>
    </div>
  );
}
