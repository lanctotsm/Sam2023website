// src/App.tsx

import React from 'react';
import './styles/app.scss';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import MyNav from './components/MyNav';
import routes from './routes';
import { Container } from 'react-bootstrap';
import Footer from './components/Footer';

const App: React.FC = () => {

  return (
   <Router>
      <MyNav />
      <Container>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.component } />
        ))}
      </Routes>
      </Container>
      <Footer></Footer>
   </Router>   
  );
};

export default App;