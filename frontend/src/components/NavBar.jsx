import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClusterImage from '../assets/cluster.png';

// NavBar component provides the main navigation bar for the application,
// showing different options based on the user's authentication status
function NavBar({ isAuthenticated, onLogout }) {
  // State to track hover effects for the Login and Sign Up buttons
  const [isHoveredLogin, setIsHoveredLogin] = useState(false);
  const [isHoveredSignUp, setIsHoveredSignUp] = useState(false);
  
  // useNavigate hook to programmatically navigate after logout
  const navigate = useNavigate();

  // Calls the logout handler passed from parent and navigates to the home page
  const handleLogout = () => {
    onLogout();
    navigate('/');  
  };

  return (
    <nav className="navbar fixed-top navbar-expand-md navbar-light" style={{ backgroundColor: '#90D5FF' }}>
      <div className="container-fluid">
        {/* Logo and brand name for the app */}
        <div className="d-flex align-items-center">
          <img 
            src={ClusterImage} 
            alt="Cluster logo" 
            style={{ width: '40px', height: '40px', marginRight: '4px' }} 
          />
          <span className="navbar-brand mb-0 h5">LessonQA</span>
        </div>
        
        {/* Responsive navbar toggler for smaller screens */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Navbar links, shown in a collapsible section for responsiveness */}
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/upload">Upload</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/uploadhistory">History</Link>
            </li>
          </ul>
          
          {/* Conditionally renders Logout button if authenticated, else shows Login and Sign Up */}
          {isAuthenticated ? (
            <button type="button" className="btn btn-dark" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              {/* Sign Up button with hover effect */}
              <Link to="/signup">
                <button
                  type="button"
                  className="btn btn-dark"
                  style={{ 
                    color: 'black', backgroundColor: isHoveredSignUp ? '#B3E7FF' : '#D1F3FF', 
                    border: 'none'
                  }}
                  onMouseEnter={() => setIsHoveredSignUp(true)}
                  onMouseLeave={() => setIsHoveredSignUp(false)}
                >
                  Sign Up
                </button>
              </Link>
              
              {/* Login button with hover effect */}
              <Link to="/login">
                <button
                  type="button"
                  className="btn btn-dark"
                  style={{ 
                    color: 'black', backgroundColor: isHoveredLogin ? '#B3E7FF' : '#D1F3FF', marginLeft: '10px', 
                    border: 'none'
                  }}
                  onMouseEnter={() => setIsHoveredLogin(true)}
                  onMouseLeave={() => setIsHoveredLogin(false)}
                >
                  Login
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
