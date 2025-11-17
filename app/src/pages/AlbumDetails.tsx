import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { albumApi } from '../api/albumApi';
import { AlbumSummary, PhotoMetadata } from '../api/types';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import PhotoGrid from '../components/photos/PhotoGrid';
import { useAuth } from '../context/AuthContext';
import NotFoundPage from './NotFound';

const AlbumDetailsPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { status } = useAuth();
  const [album, setAlbum] = useState<AlbumSummary | null>(null);
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const loadAlbumData = useCallback(async () => {
    if (!albumId) return;

    setLoading(true);
    setError(null);

    try {
      const [albumsResponse, photosResponse] = await Promise.all([
        albumApi.list(),
        albumApi.listPhotos(albumId),
      ]);
      const currentAlbum = albumsResponse.albums.find((item) => item.id === albumId) ?? null;
      setAlbum(currentAlbum);
      setPhotos(photosResponse.photos);
    } catch (err) {
      console.error('Failed to load album detail', err);
      if (albumApi.isUnauthorized(err)) {
        setError('unauthorized');
      } else {
        setError('Unable to load album. Please try again.');
        toast({
          title: 'Error loading album',
          description: 'Please refresh the page or try again later.',
          status: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [albumId, toast]);

  useEffect(() => {
    if (status === 'authenticated') {
      void loadAlbumData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, loadAlbumData]);

  if (!albumId) {
    return <NotFoundPage />;
  }

  if (status === 'loading' || loading) {
    return <LoadingState label="Loading album…" />;
  }

  if (status !== 'authenticated') {
    return (
      <EmptyState
        title="Albums are private"
        description="Sign in to view album details."
        action={
          <Button as={RouterLink} to="/login" colorScheme="teal">
            Go to Login
          </Button>
        }
      />
    );
  }

  if (error === 'unauthorized') {
    return (
      <EmptyState
        title="Session expired"
        description="Please sign in again to open this album."
        action={
          <Button as={RouterLink} to="/login" colorScheme="teal">
            Sign in
          </Button>
        }
      />
    );
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  if (!album) {
    return <NotFoundPage message="The requested album could not be found." />;
  }

  return (
    <Box py={10}>
      <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
        <Stack spacing={2}>
          <Heading>{album.name}</Heading>
          <Text color="gray.300">{photos.length} photos</Text>
        </Stack>
        <Button
          as={RouterLink}
          to={`/upload?albumId=${album.id}`}
          colorScheme="teal"
          variant="solid"
        >
          Upload Photo
        </Button>
      </Flex>

      {photos.length === 0 ? (
        <EmptyState
          title="No photos in this album yet"
          description="Upload photos to start building this collection."
          actionLabel="Upload photo"
          onAction={() => navigate(`/upload?albumId=${album.id}`)}
        />
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </Box>
  );
};

export default AlbumDetailsPage;
