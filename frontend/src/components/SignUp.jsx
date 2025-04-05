import axios from 'axios';
import React, { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// SignUp component allows users to register for an account and logs them in after successful registration
function SignUp({ setAuthToken }) { 
  // State to handle form input, error messages, password visibility, and button hover effects
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [submitHover, setSubmitHover] = useState(false);
  const [showPasswordHover, setShowPasswordHover] = useState(false);

  // Updates form data as the user types in the username, email, and password fields
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles registration and automatically logs in the user on successful registration
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Sends a POST request to the registration endpoint
      await axios.post(
        'http://127.0.0.1:8000/register', 
        formData, 
        { headers: { 'Content-Type': 'application/json' } }
      );

      // After successful registration, logs in the user
      const loginResponse = await axios.post(
        'http://127.0.0.1:8000/login', 
        {
          email: formData.email,
          password: formData.password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      // Saves the token in the state and navigates to the homepage
      const token = loginResponse.data.access_token;
      setAuthToken(token);
      navigate('/');
    } catch (err) {
      // Displays an error message if registration or login fails
      setError(err.response?.data?.detail || 'Registration or login failed');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Sign Up</h2>
      
      {/* Shows an alert if there’s an error */}
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Sign up form fields for username, email, and password */}
      <Form onSubmit={handleSignUp}>
        
        {/* Username input field */}
        <Form.Group className="mb-3" style={{textAlign:'left', fontWeight:'bold'}} controlId="formUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Enter your username"
            style={{
              outline: 'none',
              boxShadow: 'none',
            }}
            required
          />
        </Form.Group>
        
        {/* Email input field */}
        <Form.Group className="mb-3" style={{textAlign:'left', fontWeight:'bold'}} controlId="formEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            style={{
              outline: 'none',
              boxShadow: 'none',
            }}
            required
          />
        </Form.Group>
        
        {/* Password input field with show/hide toggle button */}
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
            {/* Toggle button for password visibility with hover effect */}
            <Button
                onMouseEnter={() => setShowPasswordHover(true)}
                onMouseLeave={() => setShowPasswordHover(false)}
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                    borderTopLeftRadius: '0',
                    borderBottomLeftRadius: '0',
                    backgroundColor: showPasswordHover ? '#B3E7FF' : '#D1F3FF',
                    color: "#000000",
                    border: 'none' 
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
        >Sign Up</Button>
      </Form>
    </div>
  );
}

export default SignUp;
