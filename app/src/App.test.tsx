import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders app with navigation', async () => {
    render(<App />)
    
    // Wait for the navigation to render (auth check happens asynchronously)
    await waitFor(() => {
      expect(screen.getByText(/home/i)).toBeInTheDocument()
    })
    
    // Check if the main navigation elements are present
    expect(screen.getByText(/home/i)).toBeInTheDocument()
    expect(screen.getByText(/gallery/i)).toBeInTheDocument()
    expect(screen.getByText(/resume/i)).toBeInTheDocument()
  })

  it('renders about me section', async () => {
    render(<App />)
    
    // Wait for the content to render
    await waitFor(() => {
      expect(screen.getByText(/about me/i)).toBeInTheDocument()
    })
    
    // Check if the about me content is present
    expect(screen.getByText(/about me/i)).toBeInTheDocument()
    expect(screen.getByText(/hello!/i)).toBeInTheDocument()
  })
})
