import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { apiService, Album } from '../services/api';

const Upload: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAlbums();
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadAlbums = async () => {
    try {
      setLoadingAlbums(true);
      const response = await apiService.listAlbums();
      setAlbums(response.albums || []);
      if (response.albums.length > 0) {
        setSelectedAlbumId(response.albums[0].album_id);
      }
    } catch (err: any) {
      console.error('Failed to load albums:', err);
      setError('Failed to load albums. Please try again.');
    } finally {
      setLoadingAlbums(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!selectedAlbumId) {
      setError('Please select an album');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];

          const uploadRequest = {
            imageData: base64String,
            contentType: selectedFile.type,
            albumId: selectedAlbumId,
            title: title || undefined,
            description: description || undefined,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
          };

          await apiService.uploadPhoto(uploadRequest);
          setSuccess(true);
          
          // Reset form
          setSelectedFile(null);
          setPreview(null);
          setTitle('');
          setDescription('');
          setTags('');

          // Redirect to album after short delay
          // Store timeout ID so we can clean it up if component unmounts
          const albumId = selectedAlbumId; // Capture value for closure
          timeoutRef.current = setTimeout(() => {
            navigate(`/albums/${albumId}`);
            timeoutRef.current = null;
          }, 1500);
        } catch (err: any) {
          console.error('Upload failed:', err);
          setError(err.response?.data?.error || 'Failed to upload photo');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError('Failed to upload photo');
      setLoading(false);
    }
  };

  if (loadingAlbums) {
    return (
      <Container>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (albums.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          You need to create at least one album before uploading photos.
          <Button
            variant="text"
            onClick={() => navigate('/manage-albums')}
            sx={{ ml: 2 }}
          >
            Create Album
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Photo
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <form onSubmit={handleUpload}>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Album selection */}
              <FormControl fullWidth required>
                <InputLabel>Select Album</InputLabel>
                <Select
                  value={selectedAlbumId}
                  label="Select Album"
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                >
                  {albums.map((album) => (
                    <MenuItem key={album.album_id} value={album.album_id}>
                      {album.name} ({album.photo_count} photos)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* File input */}
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    {selectedFile ? selectedFile.name : 'Choose Image'}
                  </Button>
                </label>
              </Box>

              {/* Preview */}
              {preview && (
                <Paper sx={{ p: 2 }}>
                  <Box
                    component="img"
                    src={preview}
                    alt="Preview"
                    sx={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'contain',
                    }}
                  />
                </Paper>
              )}

              {/* Optional metadata */}
              <TextField
                label="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />

              <TextField
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Tags (comma-separated, optional)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="landscape, vacation, family"
                fullWidth
              />

              {error && <Alert severity="error">{error}</Alert>}
              {success && (
                <Alert severity="success">
                  Photo uploaded successfully! Redirecting...
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !selectedFile}
                startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {loading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Upload;
