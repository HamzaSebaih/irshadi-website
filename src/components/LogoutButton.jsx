// LogoutButton.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
    const navigate = useNavigate(); // Initialize useNavigate
    const { logout } = useAuth(); // Destructure the logout function from the context
    const handleLogout = async () => {
        try {
            await logout();
            console.log('User signed out');
            navigate('/pages/LoginPages/LoginPage'); // Replace '/login' with your login route
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
  return (
    <button onClick={handleLogout}>Logout</button>
  );
}

export default LogoutButton;