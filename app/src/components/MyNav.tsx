import { NavLink } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import {LinkContainer} from 'react-router-bootstrap'
import { Button } from '@mui/material';
import { Logout as LogoutIcon, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

function MyNav() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Navbar expand="lg" className="bg-secondary rounded-bottom">
      <Container>
        <Navbar.Brand  as={NavLink} to="/">Sam L</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/">
              <Nav.Link as={NavLink} to="/">Home</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/albums">
              <Nav.Link as={NavLink} to="/albums">Albums</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/Gallery">
              <Nav.Link as={NavLink} to="/Gallery" className='styles.navLink'>Gallery</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/Resume">
              <Nav.Link as={NavLink} to="/Resume">Resume</Nav.Link>
            </LinkContainer>
            {isAuthenticated && (
              <>
                <LinkContainer to="/upload">
                  <Nav.Link as={NavLink} to="/upload">Upload</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/manage-albums">
                  <Nav.Link as={NavLink} to="/manage-albums">Manage</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
          <Nav className="ms-auto">
            {isAuthenticated ? (
              <Button
                startIcon={<LogoutIcon />}
                onClick={logout}
                variant="outlined"
                size="small"
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.7)',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Logout
              </Button>
            ) : (
              <LinkContainer to="/login">
                <Button
                  startIcon={<LoginIcon />}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.7)',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Login
                </Button>
              </LinkContainer>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
export default MyNav;