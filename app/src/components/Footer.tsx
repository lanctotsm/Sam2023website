import React from "react";
import { Row } from "react-bootstrap";
import Container from 'react-bootstrap/Container';

const Footer: React.FC = () => {
    return(
        <Container>
            <footer className='text-center'>
                <Row>
                    <div className="col-md-6">
                     <p>&copy; 2024 - Sam Lanctot</p>
                     </div>
                     <div className="col-md-6">
                        <div className="social-icons">
                            <a className="social-icon" href="https://github.com/lanctotsm/Sam2023website">
                                <i className="fa fa-github"></i>
                            </a>
                            <a className="social-icon" href="https://www.linkedin.com/in/sam-lanctot-0b1b0b1b1/">
                                <i className="fa fa-linkedin"></i>
                            </a>
                        </div>
                     </div>
                </Row>               
            </footer>
        </Container>
    )
}

export default Footer;