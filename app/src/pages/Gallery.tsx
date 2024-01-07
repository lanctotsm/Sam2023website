import Container from 'react-bootstrap/Container';
import ImageGrid from '../components/ImageGrid';
import { ImageGridProps } from '../interfaces/ImageGridProps';
const Gallery: React.FC  = ( ) => {
    return(
        <Container>
            <h1 className='text-center'>My Image Gallery</h1>
            <div className='col-lg-8'>
            <ImageGrid images={[]} />
            </div>
         </Container>
    )
}
export default Gallery;