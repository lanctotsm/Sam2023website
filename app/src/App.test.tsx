import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';

const renderWithProviders = () => {
  render(
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ChakraProvider>,
  );
};

test('renders app with navigation', async () => {
  renderWithProviders();

  const homeLink = await screen.findByRole('button', { name: /home/i });
  const albumsLink = await screen.findByRole('button', { name: /albums/i });
  const resumeLink = await screen.findByRole('button', { name: /resume/i });
  const loginButton = await screen.findByRole('button', { name: /login/i });

  expect(homeLink).toBeInTheDocument();
  expect(albumsLink).toBeInTheDocument();
  expect(resumeLink).toBeInTheDocument();
  expect(loginButton).toBeInTheDocument();
});

test('renders about me section', async () => {
  renderWithProviders();

  const aboutHeading = await screen.findByText(/about me/i);
  const helloText = await screen.findByText(/hello!/i);

  expect(aboutHeading).toBeInTheDocument();
  expect(helloText).toBeInTheDocument();
});
