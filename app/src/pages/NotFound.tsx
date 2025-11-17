import { Box, Button, Heading, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

interface NotFoundProps {
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const NotFoundPage: React.FC<NotFoundProps> = ({
  title = 'Page Not Found',
  message = "The page you're looking for does not exist or is unavailable.",
  ctaLabel = 'Back to Home',
  ctaHref = '/',
}) => (
  <Box textAlign="center" py={24}>
    <Heading mb={4}>{title}</Heading>
    <Text color="gray.300" mb={8}>
      {message}
    </Text>
    <Button as={RouterLink} to={ctaHref} colorScheme="teal">
      {ctaLabel}
    </Button>
  </Box>
);

export default NotFoundPage;
