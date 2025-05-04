// LogoutButton.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';

function LogoutButton() {
    const navigate = useNavigate();
    const { logout } = useAuth(); 
    const handleLogout = async () => {
        try {
            await logout();
            console.log('User signed out');
            navigate('/'); 
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
  return (
    // Styled similarly to inactive NavLink for consistency within the accent Nav
    <button
        className='rounded-md px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-light hover:text-black focus:outline-none focus:ring-2 focus:ring-accent-light focus:ring-offset-2 focus:ring-offset-accent'
        onClick={handleLogout}
    >
        Logout
    </button>
  );
}

export default LogoutButton;