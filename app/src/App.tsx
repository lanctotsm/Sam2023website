// src/App.tsx

import React from 'react';
import './styles/app.scss';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box, Container } from '@chakra-ui/react';
import MyNav from './components/MyNav';
import routes from './routes';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <Router>
      <Box minH="100vh" bg="gray.900" color="gray.100" display="flex" flexDirection="column">
        <MyNav />
        <Box flex="1">
          <Container maxW="6xl" py={10}>
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </Container>
        </Box>
        <Footer />
      </Box>
    </Router>
  );
};

export default App;