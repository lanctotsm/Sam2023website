import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { albumApi } from '../api/albumApi';
import { photoApi, fileToBase64 } from '../api/photoApi';
import { AlbumSummary } from '../api/types';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const UploadPage: React.FC = () => {
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const loadAlbums = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await albumApi.list();
        setAlbums(response.albums);
      } catch (err) {
        console.error('Failed to fetch albums for upload', err);
        setError('Unable to load albums. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void loadAlbums();
  }, []);

  const presetAlbumId = searchParams.get('albumId');

  useEffect(() => {
    if (presetAlbumId && albums.some((album) => album.id === presetAlbumId)) {
      setSelectedAlbum(presetAlbumId);
    } else if (!presetAlbumId && albums.length > 0 && !selectedAlbum) {
      setSelectedAlbum(albums[0].id);
    }
  }, [albums, presetAlbumId, selectedAlbum]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name);
      }
    }
  };

  const disabled = useMemo(() => {
    return uploading || !selectedFile || !selectedAlbum;
  }, [uploading, selectedAlbum, selectedFile]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !selectedAlbum) {
      toast({
        title: 'Missing required fields',
        description: 'Please select an album and a file to upload.',
        status: 'warning',
      });
      return;
    }

    setUploading(true);
    try {
      const imageData = await fileToBase64(selectedFile);
      const tagList = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      await photoApi.upload({
        albumId: selectedAlbum,
        imageData,
        contentType: selectedFile.type,
        title: title || selectedFile.name,
        description,
        tags: tagList,
      });

      toast({
        title: 'Upload complete',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(`/albums/${selectedAlbum}`);
    } catch (err) {
      console.error('Upload failed', err);
      toast({
        title: 'Upload failed',
        description: 'Please try again.',
        status: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading albums…" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  if (albums.length === 0) {
    return (
      <ErrorState
        title="No albums available"
        description="Create an album before uploading photos."
        action={
          <Button as="a" href="/albums" colorScheme="teal">
            Create Album
          </Button>
        }
      />
    );
  }

  return (
    <Box py={10}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={6}>
          <FormControl isRequired>
            <FormLabel>Album</FormLabel>
            <Select value={selectedAlbum} onChange={(event) => setSelectedAlbum(event.target.value)}>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Photo</FormLabel>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </FormControl>

          <FormControl>
            <FormLabel>Title</FormLabel>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </FormControl>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Tags (comma separated)</FormLabel>
            <Input value={tags} onChange={(event) => setTags(event.target.value)} />
          </FormControl>

          <Button type="submit" colorScheme="teal" isLoading={uploading} isDisabled={disabled}>
            Upload Photo
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default UploadPage;
