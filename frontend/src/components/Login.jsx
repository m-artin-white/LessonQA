import axios from 'axios';
import React, { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Login component handles user authentication and provides feedback on login attempts
function Login({ setAuthToken }) {
  // State to manage form data, error messages, password visibility, and button hover states
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);
  const [showPasswordHover, setShowPasswordHover] = useState(false);

  // Updates form data as user types in email and password fields
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles the login process, sending credentials to the server and saving token if successful
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Sends a POST request to the server with login credentials
      const response = await axios.post(
        'http://127.0.0.1:8000/login',
        formData,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      // On success, stores the auth token and updates auth state
      const token = response.data.access_token;
      const expirationTime = Date.now() + 60 * 60 * 1000; // 1 hour from now

      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiration', expirationTime); // Store expiration time
  
      setAuthToken(token);
    } catch (err) {
      // On failure, displays an error message
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      
      {/* Displays error message if login fails */}
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Login form with email and password inputs */}
      <Form onSubmit={handleLogin}>
        {/* Email input field */}
        <Form.Group className="mb-3" style={{textAlign:'left', fontWeight:'bold'}} controlId="formEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            style={{
              outline: 'none',
              boxShadow: 'none',
            }}
            placeholder="Enter your email"
            required
          />
        </Form.Group>
        
        {/* Password input field with show/hide functionality */}
        <Form.Group className="mb-3" style={{textAlign:'left', fontWeight:'bold'}} controlId="formPassword">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              style={{
                outline: 'none',
                boxShadow: 'none',
              }}
              required
            />
            {/* Button to toggle password visibility */}
            <Button
              variant="outline-secondary"
              onMouseEnter={() => setShowPasswordHover(true)}
              onMouseLeave={() => setShowPasswordHover(false)}
              onClick={() => setShowPassword(!showPassword)}
              style={{
                borderTopLeftRadius: '0',
                borderBottomLeftRadius: '0',
                backgroundColor: showPasswordHover ? '#B3E7FF' : '#D1F3FF',
                border: 'none',
                color: "#000000"
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </Button>
          </InputGroup>
        </Form.Group>
        
        {/* Submit button with hover effect */}
        <Button
          variant="primary"
          type="submit"
          onMouseEnter={() => setSubmitHover(true)}
          onMouseLeave={() => setSubmitHover(false)}
          style={{
            backgroundColor: submitHover ? '#B3E7FF' : '#D1F3FF',
            border: 'none',
            color: "#000000"
          }}
        >
          Login
        </Button>

        {/* Link to redirect users to the registration page if not signed up */}
        <div className="mt-3">
          <p className="mt-3">
            Not signed up? <Link to="/signup">Register here!</Link>
          </p>
        </div>
      </Form>
    </div>
  );
}

export default Login;
