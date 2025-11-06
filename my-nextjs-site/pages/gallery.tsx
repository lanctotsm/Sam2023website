import React, { useState, useEffect } from 'react';
import { PhotoAPI, Photo } from '../lib/photoApi';

const BUCKET_URL = process.env.NEXT_PUBLIC_S3_BUCKET_URL || 'https://your-bucket-name.s3.us-east-1.amazonaws.com';

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const result = await PhotoAPI.listPhotos();
      setPhotos(result.photos.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const imageData = await PhotoAPI.fileToBase64(selectedFile);
      const tags = uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);

      await PhotoAPI.uploadPhoto({
        imageData,
        contentType: selectedFile.type,
        title: uploadForm.title || selectedFile.name,
        description: uploadForm.description,
        tags,
      });

      // Reset form and reload photos
      setSelectedFile(null);
      setUploadForm({ title: '', description: '', tags: '' });
      await loadPhotos();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Image Gallery</h1>
        <p>Loading photos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Image Gallery</h1>
      
      {/* Upload Form */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Upload New Photo</h2>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              required
            />
          </div>
          
          {selectedFile && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  placeholder="Description (optional)"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              
              <button
                type="submit"
                disabled={uploading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: uploading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <p>No photos uploaded yet. Upload your first photo above!</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
        }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white',
              }}
            >
              <img
                src={PhotoAPI.getPhotoUrl(BUCKET_URL, photo.mediumKey)}
                alt={photo.title}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                }}
              />
              <div style={{ padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  {photo.title}
                </h3>
                {photo.description && (
                  <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                    {photo.description}
                  </p>
                )}
                {photo.tags.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    {photo.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#e9ecef',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          marginRight: '0.5rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <small style={{ color: '#999' }}>
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
