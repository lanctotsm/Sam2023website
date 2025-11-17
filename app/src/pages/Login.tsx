import { Box, Button, Heading, ListItem, Text, UnorderedList } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login, status } = useAuth();

  const handleLogin = () => {
    void login();
  };

  return (
    <Box py={12}>
      <Heading mb={4}>Sign in to manage your albums</Heading>
      <Text color="gray.300" mb={6}>
        The photo management dashboard is protected with Google OAuth 2FA to ensure only the site
        owner can upload or edit content.
      </Text>

      <UnorderedList mb={6} color="gray.300">
        <ListItem>Click the button below to start the secure Google login flow.</ListItem>
        <ListItem>Complete the two-factor authentication challenge when prompted.</ListItem>
        <ListItem>You&apos;ll be redirected back once the session is established.</ListItem>
      </UnorderedList>

      <Button size="lg" colorScheme="teal" onClick={handleLogin} isDisabled={status === 'loading'}>
        Continue with Google
      </Button>
    </Box>
  );
};

export default LoginPage;
