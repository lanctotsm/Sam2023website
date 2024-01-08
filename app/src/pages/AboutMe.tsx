import Container from 'react-bootstrap/Container';
import SectionTitle from '../components/SectionTitle';
import SectionDivider from '../components/SectionDivider';
import { Col, Row } from 'react-bootstrap';

const AboutMe: React.FC  = ()=>{
    return(
        <Container>
            <SectionTitle>About Me</SectionTitle>
            <SectionDivider/>
            <Row className='justify-content-center'>
            <Col md='auto' lg='8' sm='6' style={{color:'white',fontSize:'1.2rem'}} >
                <p className='pt-4' >
                    <b>Hello!</b> <br></br>
                    My name is Sam Lanctot, I'm a software engineer in the DC metro area. Currently I'm employed at Capital One in Tysons Corner, Virginia. I have 7 years experience in full stack .Net development and 2 years experience in Nodejs/Python/Scala development in my current role. 
                    <br></br>

                </p>
                <p>
                    My hobbies include photography, Magic the Gathering, Dungeons & Dragons, and video games. I also enjoy traveling especially by train.
                </p>
                <p>
                I live in Silver Spring with my wife Caitlin and our two wonderful cats, Catniss and Byron.
                </p>
            </Col>
            </Row>
         </Container>
    )
}
export default AboutMe;