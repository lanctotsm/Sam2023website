import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app with navigation', () => {
  render(<App />);
  
  // Check if the main navigation elements are present
  const homeLink = screen.getByText(/home/i);
  const galleryLink = screen.getByText(/gallery/i);
  const resumeLink = screen.getByText(/resume/i);
  
  expect(homeLink).toBeInTheDocument();
  expect(galleryLink).toBeInTheDocument();
  expect(resumeLink).toBeInTheDocument();
});

test('renders about me section', () => {
  render(<App />);
  
  // Check if the about me content is present
  const aboutHeading = screen.getByText(/about me/i);
  const helloText = screen.getByText(/hello!/i);
  
  expect(aboutHeading).toBeInTheDocument();
  expect(helloText).toBeInTheDocument();
});
