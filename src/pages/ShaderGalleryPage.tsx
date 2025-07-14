import React from 'react';
import ShaderGallery from '../components/ShaderGallery';

const ShaderGalleryPage: React.FC = () => {
  // Use a default test image or pattern
  const defaultImageData = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSI1MTIiIHkyPSI1MTIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwRkZGRiIvPgo8c3RvcCBvZmZzZXQ9IjAuNSIgc3RvcC1jb2xvcj0iI0ZGMDBGRiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRkZGMDAiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzBfMSkiLz4KPGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIxMDAiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4K";

  return (
    <div className="min-h-screen bg-background">
      <ShaderGallery imageData={defaultImageData} />
    </div>
  );
};

export default ShaderGalleryPage; 