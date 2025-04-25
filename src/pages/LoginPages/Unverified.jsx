import React, { useState, useEffect } from 'react'; // Import useState
import { useNavigate } from 'react-router';
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeft } from 'lucide-react';
import { sendEmailVerification } from "firebase/auth";

export default function Unverified() {
    const navigate = useNavigate();
    const { user,logout } = useAuth(); // Get the user object
    const [loading, setLoading] = useState(false); // State for loading indicator
    const [message, setMessage] = useState('');   // State for success messages
    const [error, setError] = useState('');     // State for error messages



    const handleReturn = () => { // No need for async here
      logout(user)
        navigate('/');
    };

    // Handle browser back button (keep this as is, but remove async if not needed)
    useEffect(() => {
        const handlePopState = () => {
            navigate('/');
        };

        window.addEventListener('popstate', handlePopState);
        // Ensure user is defined before adding listener if needed, or adjust dependency array
        return () => window.removeEventListener('popstate', handlePopState);
    }, [navigate]); // Simplified dependency

    // --- Function to handle sending the verification email ---
    const handleSendVerification = async () => {
        if (!user) {
            setError("No user is currently logged in."); // Should ideally not happen here
            return;
        }

        setLoading(true);
        setError(''); // Clear previous errors
        setMessage(''); // Clear previous messages

        try {
            await sendEmailVerification(user);
            setMessage(`Verification email sent successfully to ${user.email}. Please check your inbox (and spam folder).`);
        } catch (err) {
            console.error("Error sending verification email:", err);
            // Provide a more user-friendly error message
            setError("Failed to send verification email. Please try again later or contact support.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-white text-center px-4">
            {/* Back Button */}
            <button
                onClick={handleReturn}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 self-start md:self-center" // Adjust alignment as needed
                disabled={loading} // Disable when loading
            >
                <ArrowLeft size={24} />
                <span className="text-lg font-medium">Go back</span>
            </button>

            <h1 className="text-2xl font-semibold text-gray-800 mb-4">
                Please verify your email address
            </h1>

            {/* Display the user's email for confirmation */}
            {user?.email && (
                <p className="text-gray-600 mb-6">
                    A verification link needs to be sent to: <strong>{user.email}</strong>
                </p>
            )}

            {/* Send Verification Button */}
            <button
                onClick={handleSendVerification}
                disabled={loading || !user} // Disable button if loading or no user object
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed mb-4 transition duration-150 ease-in-out"
            >
                {loading ? 'Sending...' : 'Send Verification Email'}
            </button>

            {/* Display Success or Error Messages */}
            {message && <p className="text-green-600 mt-4">{message}</p>}
            {error && <p className="text-red-600 mt-4">{error}</p>}

            <p className="text-sm text-gray-500 mt-8">
                Once verified, you might need to log out and log back in.
            </p>
        </div>
    );
}