import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingStateProps {
  label?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading…' }) => (
  <Center py={10}>
    <VStack spacing={4}>
      <Spinner size="xl" color="teal.300" thickness="4px" />
      <Text color="gray.300">{label}</Text>
    </VStack>
  </Center>
);

export default LoadingState;
