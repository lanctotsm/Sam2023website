import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import AlbumCard from '../components/albums/AlbumCard';
import CreateAlbumModal from '../components/albums/CreateAlbumModal';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthContext';
import { albumApi } from '../api/albumApi';
import { AlbumSummary } from '../api/types';
import { Link as RouterLink } from 'react-router-dom';

const AlbumsPage: React.FC = () => {
  const { status } = useAuth();
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await albumApi.list();
      setAlbums(response.albums);
    } catch (err) {
      console.error('Failed to load albums', err);
      if (albumApi.isUnauthorized(err)) {
        setError('unauthorized');
      } else {
        setError('Unable to load albums. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      void loadAlbums();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setAlbums([]);
    }
  }, [status, loadAlbums]);

  const handleCreateAlbum = async (name: string) => {
    await albumApi.create({ name });
    await loadAlbums();
  };

  if (status === 'loading') {
    return <LoadingState label="Loading albums…" />;
  }

  if (status !== 'authenticated') {
    return (
      <EmptyState
        title="Albums are private"
        description="Sign in to view and manage photo collections."
        action={
          <Button as={RouterLink} to="/login" colorScheme="teal">
            Go to Login
          </Button>
        }
      />
    );
  }

  if (loading) {
    return <LoadingState label="Loading albums…" />;
  }

  if (error && error !== 'unauthorized') {
    return <ErrorState description={error} />;
  }

  if (error === 'unauthorized') {
    return (
      <EmptyState
        title="Session expired"
        description="Please sign in again to view your albums."
        action={
          <Button as={RouterLink} to="/login" colorScheme="teal">
            Sign in
          </Button>
        }
      />
    );
  }

  return (
    <Box py={10}>
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" mb={1}>
            Albums
          </Heading>
          <Text color="gray.300">
            Organize your photos into collections for easier browsing.
          </Text>
        </Box>
        <Button colorScheme="teal" onClick={onOpen}>
          Create Album
        </Button>
      </Flex>

      {albums.length === 0 ? (
        <EmptyState
          title="No albums yet"
          description="Create your first album to start organizing photos."
          actionLabel="Create album"
          onAction={onOpen}
        />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </SimpleGrid>
      )}

      <CreateAlbumModal isOpen={isOpen} onClose={onClose} onCreate={handleCreateAlbum} />
    </Box>
  );
};

export default AlbumsPage;
