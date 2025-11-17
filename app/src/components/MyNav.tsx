import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/albums', label: 'Albums' },
  { to: '/resume', label: 'Resume' },
];

const MyNav: React.FC = () => {
  const { status, logout } = useAuth();
  const bg = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');

  const authenticatedLinks =
    status === 'authenticated'
      ? [...navLinks, { to: '/upload', label: 'Upload' }]
      : navLinks;

  const handleLogout = () => {
    void logout();
  };

  return (
    <Box bg={bg} borderBottom="1px solid" borderColor={borderColor} px={6}>
      <Flex h={16} alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Heading size="md">Sam L</Heading>
        <HStack spacing={4} wrap="wrap" justify="center">
          {authenticatedLinks.map((link) => (
            <Button
              key={link.to}
              as={RouterNavLink}
              to={link.to}
              variant="ghost"
              colorScheme="teal"
              fontWeight="medium"
              _activeLink={{ bg: 'teal.600', color: 'white' }}
            >
              {link.label}
            </Button>
          ))}
        </HStack>
        <Stack direction="row" spacing={3}>
          {status === 'authenticated' ? (
            <Button colorScheme="teal" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button as={RouterNavLink} to="/login" colorScheme="teal">
              Login
            </Button>
          )}
        </Stack>
      </Flex>
    </Box>
  );
};

export default MyNav;