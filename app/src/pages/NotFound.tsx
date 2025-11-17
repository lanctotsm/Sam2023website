import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Error as ErrorIcon } from '@mui/icons-material';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        gap={2}
      >
        <ErrorIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
        <Typography variant="h3" component="h1">
          404
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          The page you're looking for doesn't exist or you don't have permission to access it.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
