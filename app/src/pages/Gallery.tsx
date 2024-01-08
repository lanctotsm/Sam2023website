import Container from 'react-bootstrap/Container';
import ImageGrid from '../components/ImageGrid';
import SectionDivider from '../components/SectionDivider';
import SectionTitle from '../components/SectionTitle';
const Gallery: React.FC  = ( ) => {
    return(
        <Container>
            <SectionTitle>Photos of Me And Other Things</SectionTitle>
            <SectionDivider/>
            <div className='col-lg-8'>
            <ImageGrid images={[
                'https://sam-website-bucket.s3.amazonaws.com/images/GotokujiTemple.jpg',
                'https://sam-website-bucket.s3.amazonaws.com/images/HimejiCastle.JPG',
                'https://sam-website-bucket.s3.amazonaws.com/images/Kyoto.JPG',
                'https://sam-website-bucket.s3.amazonaws.com/images/OkumiyaPagoda.jpg',
                'https://sam-website-bucket.s3.amazonaws.com/images/TrainRide.JPG',
                'https://sam-website-bucket.s3.amazonaws.com/images/MomijiNikko.jpg'
                ]} />
            </div>
         </Container>
    )
}
export default Gallery;