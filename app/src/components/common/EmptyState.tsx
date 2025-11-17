import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  action,
}) => (
  <Box
    borderWidth="1px"
    borderRadius="lg"
    borderStyle="dashed"
    borderColor="gray.600"
    p={8}
    textAlign="center"
  >
    <VStack spacing={4}>
      <Heading size="md">{title}</Heading>
      {description && <Text color="gray.300">{description}</Text>}
      {action}
      {actionLabel && onAction && (
        <Button colorScheme="teal" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </VStack>
  </Box>
);

export default EmptyState;
