// src/App.tsx

import React from 'react';
import './styles/app.scss';
import ImageGrid from './components/ImageGrid';
import MyNav from './components/MyNav';

const App: React.FC = () => {
  const images = ['url1', 'url2', 'url3', 'url4']; // replace with your actual image URLs

  return (
    <div className="App container">
      <MyNav/>
      <h1 className='text-center'>My Image Gallery</h1>
      <hr className='pb-1'/>
      <div className='col-lg-8'>
      <ImageGrid images={images} />
      </div>
    </div>
  );
};

export default App;