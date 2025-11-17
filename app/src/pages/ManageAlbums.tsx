import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Collections as CollectionsIcon,
} from '@mui/icons-material';
import { apiService, Album } from '../services/api';

const ManageAlbums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

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

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      setError('Album name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await apiService.createAlbum({ name: newAlbumName.trim() });
      setSuccess('Album created successfully!');
      setNewAlbumName('');
      setCreateDialogOpen(false);
      await loadAlbums();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to create album:', err);
      setError(err.response?.data?.error || 'Failed to create album');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (album: Album) => {
    setAlbumToDelete(album);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!albumToDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await apiService.deleteAlbum(albumToDelete.album_id);
      setSuccess('Album deleted successfully!');
      setDeleteDialogOpen(false);
      setAlbumToDelete(null);
      await loadAlbums();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete album:', err);
      setError(err.response?.data?.error || 'Failed to delete album');
    } finally {
      setDeleting(false);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/albums')}
          >
            Back to Albums
          </Button>
          <Typography variant="h4" component="h1">
            Manage Albums
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Album
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Album
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {albums.map((album) => (
            <Card key={album.album_id}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {album.name}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  <Chip
                    label={`${album.photo_count} ${album.photo_count === 1 ? 'photo' : 'photos'}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(album.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/albums/${album.album_id}`)}
                >
                  View Photos
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(album)}
                  sx={{ ml: 'auto' }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Create Album Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !creating && setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Album</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Album Name"
            fullWidth
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            disabled={creating}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newAlbumName.trim()) {
                handleCreateAlbum();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateAlbum}
            variant="contained"
            disabled={creating || !newAlbumName.trim()}
          >
            {creating ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Album?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the album "{albumToDelete?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will permanently delete all photos in this album. This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageAlbums;
