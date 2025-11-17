import { AspectRatio, Box, Heading, HStack, Image, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { AlbumSummary } from '../../api/types';
import { buildImageUrl } from '../../utils/imageUrl';

interface AlbumCardProps {
  album: AlbumSummary;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const coverUrl = buildImageUrl(album.thumbnailKey);

  return (
    <Box
      as={RouterLink}
      to={`/albums/${album.id}`}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="gray.800"
      _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
      transition="all 0.2s ease"
    >
      <AspectRatio ratio={4 / 3}>
        {coverUrl ? (
          <Image src={coverUrl} alt={album.name} objectFit="cover" />
        ) : (
          <Box
            bgGradient="linear(to-br, teal.500, purple.600)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontSize="4xl"
            fontWeight="bold"
          >
            📁
          </Box>
        )}
      </AspectRatio>

      <Stack spacing={2} p={4}>
        <Heading size="md" noOfLines={1}>
          {album.name}
        </Heading>
        <HStack spacing={2} color="gray.300" fontSize="sm">
          <Text>{album.photoCount} photos</Text>
        </HStack>
      </Stack>
    </Box>
  );
};

export default AlbumCard;
