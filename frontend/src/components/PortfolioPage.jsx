import React from 'react';
import clusterPhoto from "../assets/cluster.png";
import { Container, Row, Col } from 'react-bootstrap';

// PortfolioPage component displays a personal introduction and summary about Martin White
function PortfolioPage() {
  return (
    <Container className="my-5">
      
      {/* Page header with a welcome message */}
      <header className="text-center mb-4">
        <h1>Welcome to My Portfolio!</h1>
      </header>
      
      {/* Row containing an avatar image and title */}
      <Row className="justify-content-center mb-4">
        <Col md={4} className="text-center">
          <img 
            src={clusterPhoto} 
            alt="Your avatar" 
            className="mx-auto d-block"
            style={{
              borderRadius: '50%',
              width: '150px', 
              height: '150px',
              objectFit: 'cover'
            }}
          />
          <h3 className="mt-3">About Me</h3>
        </Col>
      </Row>
      
      {/* Row with a brief personal description */}
      <Row>
        <Col>
          <div className="p-4 border rounded">
            <p>
              Hi, I'm Martin White, and I'm currently a 4th year student studying Computer Science & Software Engineering. 
              I have a passion for creating GenAI applications, and I'm constantly looking to improve my skills and contribute to meaningful projects. 
              Welcome to my portfolio!
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default PortfolioPage;
