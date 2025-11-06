import React from "react";
import { Col, Row } from "react-bootstrap";
import Container from 'react-bootstrap/Container';

const Footer: React.FC = () => {
    return(
        <Container>
            <footer className='text-center'>
            <hr className='pb-1'/>

                <Row>
                    <Col md='6'>
                     <p>&copy; 2024 - Sam Lanctot</p>
                     </Col>
                     <Col md='6'>
                        <div className="social-icons">
                            <a className="social-icon" href="https://github.com/lanctotsm/Sam2023website" target="_blank">
                                <i className="fa fa-github"></i>
                            </a>
                            <a className="social-icon" href="https://www.linkedin.com/in/samuel-lanctot" target="_blank">
                                <i className="fa fa-linkedin"></i>
                            </a>
                            <a className="social-icon" href="https://www.instagram.com/lanctotsm/" target="_blank">
                                <i className="fa fa-instagram"></i>
                            </a>
                        </div>
                     </Col>
                </Row>               
            </footer>
        </Container>
    )
}

export default Footer;