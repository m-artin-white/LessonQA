import React from 'react';
import Classroom from '../assets/classroom.png';

// HomePage component displays an introduction and overview of the CLUSTER application
function HomePage() {
  return (
    <div className="container mt-5 pt-4">
      {/* Main row containing the welcome message and description */}
      <div className="row justify-content-center text-center">
        <div className="col-lg-8">
          <h1>Welcome to LessonQA</h1>
          <p className="lead mt-3">
            LessonQA offers a virtual classroom where trainee teachers can interact with AI-powered "students" that simulate real student responses and engagement.
          </p>
        </div>
      </div>
      
      {/* Row displaying an image and description about the CLUSTER application */}
      <div className="row justify-content-center align-items-center mt-5">
        <div className="col-md-6">
          {/* Classroom simulator image */}
          <img 
            src={Classroom}
            alt="AI Classroom Simulator" 
            className="img-fluid rounded"
          />
        </div>
        <div className="col-md-6 mt-4 mt-md-0">
          {/* Information section about CLUSTER */}
          <h2>About LessonQA</h2>
          <p>
            This tool enables teachers to practice delivering lessons, refine their teaching skills, and experiment with new pedagogical approaches without needing a physical classroom.
          </p>
          <p>
            Powered by Python and the MERN stack, LessonQA provides a unique environment for aspiring educators to receive AI-driven feedback and enhance their educational techniques.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
