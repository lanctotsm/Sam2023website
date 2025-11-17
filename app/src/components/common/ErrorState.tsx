import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description,
  action,
}) => (
  <Box py={4}>
    <Alert status="error" variant="subtle" borderRadius="md" flexDirection="column" alignItems="flex-start">
      <AlertIcon />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      {action && <Box mt={4}>{action}</Box>}
    </Alert>
  </Box>
);

export default ErrorState;
