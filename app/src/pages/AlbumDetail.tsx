import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardMedia,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Photo as PhotoIcon,
  Close as CloseIcon,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { apiService, Photo } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AlbumDetail: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albumName, setAlbumName] = useState<string>('Album');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (albumId) {
      loadPhotos();
    }
  }, [albumId]);

  const loadPhotos = async () => {
    if (!albumId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.listAlbumPhotos(albumId);
      setPhotos(response.photos || []);
      
      // Get album name from albums list
      const albumsResponse = await apiService.listAlbums();
      const album = albumsResponse.albums.find(a => a.album_id === albumId);
      if (album) {
        setAlbumName(album.name);
      }
    } catch (err: any) {
      console.error('Failed to load photos:', err);
      setError(err.response?.data?.error || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

  const handleCloseDialog = () => {
    setSelectedPhoto(null);
    setSelectedPhotoIndex(-1);
  };

  const handlePreviousPhoto = () => {
    if (selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhoto(photos[newIndex]);
      setSelectedPhotoIndex(newIndex);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex < photos.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhoto(photos[newIndex]);
      setSelectedPhotoIndex(newIndex);
    }
  };

  if (loading) {
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

  return (
    <Container sx={{ py: 4 }}>
      <Box mb={3}>
        <Breadcrumbs>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/albums')}
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            Albums
          </Link>
          <Typography color="text.primary">{albumName}</Typography>
        </Breadcrumbs>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/albums')}
          >
            Back to Albums
          </Button>
          <Typography variant="h4" component="h1">
            {albumName}
          </Typography>
        </Box>
        {isAuthenticated && (
          <Button
            variant="contained"
            onClick={() => navigate('/upload')}
          >
            Upload Photos
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {photos.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="40vh"
          gap={2}
        >
          <PhotoIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No photos in this album yet
          </Typography>
          {isAuthenticated && (
            <Typography variant="body2" color="text.secondary">
              Upload photos to get started
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {photos.map((photo, index) => (
            <Card
              key={photo.id}
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
              onClick={() => handlePhotoClick(photo, index)}
            >
              <CardMedia
                component="img"
                height="200"
                image={photo.thumbnail_key}
                alt={photo.title || 'Photo'}
                sx={{ objectFit: 'cover' }}
              />
            </Card>
          ))}
        </Box>
      )}

      {/* Full-size photo dialog */}
      <Dialog
        open={!!selectedPhoto}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative', backgroundColor: 'black' }}>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)',
              },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          {selectedPhoto && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              {selectedPhotoIndex > 0 && (
                <IconButton
                  onClick={handlePreviousPhoto}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                    },
                  }}
                >
                  <NavigateBefore />
                </IconButton>
              )}

              <Box
                component="img"
                src={selectedPhoto.medium_key}
                alt={selectedPhoto.title || 'Photo'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />

              {selectedPhotoIndex < photos.length - 1 && (
                <IconButton
                  onClick={handleNextPhoto}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                    },
                  }}
                >
                  <NavigateNext />
                </IconButton>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AlbumDetail;
