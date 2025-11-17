import { Badge, Box, Image, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { PhotoMetadata } from '../../api/types';
import { buildImageUrl } from '../../utils/imageUrl';

interface PhotoGridProps {
  photos: PhotoMetadata[];
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos }) => {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
      {photos.map((photo) => {
        const imageUrl = buildImageUrl(photo.mediumKey) ?? buildImageUrl(photo.thumbnailKey);
        const originalUrl = buildImageUrl(photo.originalKey) ?? imageUrl;

        return (
          <Box
            key={photo.id}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="gray.900"
            _hover={{ shadow: 'lg' }}
          >
            {imageUrl && (
              <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                <Image src={imageUrl} alt={photo.title} objectFit="cover" w="100%" h="220px" />
              </a>
            )}
            <Stack spacing={2} p={4}>
              <Text fontWeight="bold" noOfLines={1}>
                {photo.title || 'Untitled'}
              </Text>
              {photo.description && (
                <Text fontSize="sm" color="gray.300" noOfLines={2}>
                  {photo.description}
                </Text>
              )}
              {photo.tags?.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={2}>
                  {photo.tags.map((tag) => (
                    <Badge key={`${photo.id}-${tag}`} colorScheme="teal">
                      {tag}
                    </Badge>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
};

export default PhotoGrid;
