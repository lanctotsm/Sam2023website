// src/components/ImageGrid.tsx

import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ImageGridProps } from '../interfaces/ImageGridProps';

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <Container>
        <Row className="justify-content-center" style={{display:'flex'}}>
          {images.map((image, index) => (
            <Col className='pt-4' xs={6} md={4} lg={3} key={index}>
              <Image src={image} thumbnail onClick={() => setSelectedImage(image)} />
            </Col>
          ))}
        </Row>
      </Container>

      <Modal show={selectedImage !== null} onHide={() => setSelectedImage(null)}>       
        <Modal.Body>
          <Image src={selectedImage || ''} fluid />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ImageGrid;