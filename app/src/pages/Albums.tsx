import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import {
  Collections as CollectionsIcon,
  Add as AddIcon,
  Photo as PhotoIcon,
} from '@mui/icons-material';
import { apiService, Album } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.listAlbums();
      setAlbums(response.albums || []);
    } catch (err: any) {
      console.error('Failed to load albums:', err);
      setError(err.response?.data?.error || 'Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumClick = (albumId: string) => {
    navigate(`/albums/${albumId}`);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <CollectionsIcon sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1">
            Photo Albums
          </Typography>
        </Box>
        {isAuthenticated && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/manage-albums')}
          >
            Manage Albums
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {albums.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="40vh"
          gap={2}
        >
          <CollectionsIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No albums yet
          </Typography>
          {isAuthenticated && (
            <Typography variant="body2" color="text.secondary">
              Create your first album to get started
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {albums.map((album) => (
            <Card
              key={album.album_id}
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => handleAlbumClick(album.album_id)}
            >
              <CardMedia
                component="div"
                sx={{
                  height: 200,
                  backgroundColor: 'grey.300',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {album.thumbnail_id ? (
                  <Box
                    component="img"
                    src={album.thumbnail_id}
                    alt={album.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <PhotoIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                )}
              </CardMedia>
              <CardContent>
                <Typography variant="h6" component="h2" noWrap>
                  {album.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Chip
                    label={`${album.photo_count} ${album.photo_count === 1 ? 'photo' : 'photos'}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Created: {new Date(album.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Albums;
