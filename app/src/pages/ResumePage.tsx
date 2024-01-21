import Container from 'react-bootstrap/Container';
import SectionTitle from '../components/SectionTitle';
import SectionDivider from '../components/SectionDivider';
import { Col, Row } from 'react-bootstrap';
import Resume from '../components/Resume';
import data from '../resume.json';
const ResumePage: React.FC  = ()=>{
    console.log(data);

    return(
        <Container>
            <SectionTitle>Resume</SectionTitle>
            <SectionDivider/>
            <Resume resume={{resume:data}} style={{}}/>
         </Container>
    )
}
export default ResumePage;