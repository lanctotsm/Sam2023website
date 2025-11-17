import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Button, 
  Typography, 
  Paper,
  Card,
  CardContent 
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (loading) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        gap={3}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Photo Gallery
        </Typography>
        
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={2}
              py={3}
            >
              <Typography variant="h5" component="h2" gutterBottom>
                Sign In
              </Typography>
              
              <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
                Sign in with your Google account to upload and manage photos
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={login}
                fullWidth
                sx={{
                  backgroundColor: '#4285f4',
                  '&:hover': {
                    backgroundColor: '#357ae8',
                  },
                }}
              >
                Sign in with Google
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ p: 3, maxWidth: 400 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Authentication is required only for uploading photos 
            and managing albums. All albums and photos are publicly viewable.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
