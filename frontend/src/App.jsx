import './App.css';
import NavBar from './components/NavBar';
import HomePage from './components/HomePage';
import UploadPage from './components/UploadPage';
import UploadHistoryPage from './components/UploadHistoryPage';
import PortfolioPage from './components/PortfolioPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function App() {
  // Gets authToken from localStorage
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || null);

  // On app startup/boot, localStorage variables and tokens are reset
  useEffect(() => {
    if (!sessionStorage.getItem("appLoaded")) {
      console.log("Full app restart detected - Clearing session token...");
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiration");
      setAuthToken(null);
      sessionStorage.setItem("appLoaded", "true");
    }
  }, []);

  // Used to check if the authToken has expired on an interval of 1 minute
  useEffect(() => {
    const checkTokenExpiration = () => {
      const expirationTime = localStorage.getItem("tokenExpiration");

      if (expirationTime && Date.now() > parseInt(expirationTime, 10)) {
        console.log("Token expired - Logging out...");
        alert("Your session has expired. Please log in again.")
        handleLogout();
      }
    };

    checkTokenExpiration();

    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [authToken]);

  // Function to log user out and redirect to login page
  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiration");
    window.location.href = "/login";
  };

  return (
    <Router>
      <div className="App">
        <NavBar isAuthenticated={!!authToken} onLogout={handleLogout} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={authToken ? <UploadPage /> : <Navigate to="/login" />} />
            <Route path="/signup" element={authToken ? <Navigate to="/" /> : <SignUp setAuthToken={setAuthToken} />} />
            <Route path="/login" element={authToken ? <Navigate to="/" /> : <Login setAuthToken={setAuthToken} />} />
            <Route path="/uploadhistory" element={authToken ? <UploadHistoryPage /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
