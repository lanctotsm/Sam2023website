import { NavLink } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap'

function MyNav() {
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
            <LinkContainer to="/gallery">
              <Nav.Link as={NavLink} to="/gallery" className='styles.navLink'>Gallery</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/resume">
              <Nav.Link as={NavLink} to="/resume">Resume</Nav.Link>
            </LinkContainer>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
export default MyNav;