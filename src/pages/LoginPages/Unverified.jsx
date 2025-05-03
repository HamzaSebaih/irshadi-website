import React, {useState} from 'react'; 
import {useNavigate} from 'react-router';
import {useAuth} from "../../contexts/AuthContext";
import {ArrowLeft} from 'lucide-react';

export default function Unverified() {
    const navigate = useNavigate();
    const {user,logout, sendVerificationEmail} = useAuth(); 
    const [loading, setLoading] = useState(false); 
    const [message, setMessage] = useState('');   
    const [error, setError] = useState('');     

    const handleReturn = () => {
      logout(user)
        navigate('/');
    };

    const handleSendVerification = async () => {
        if (!user) {
            setError("No user is currently logged in."); 
            return;
        }
        setLoading(true);
        setError(''); 
        setMessage(''); 
        try {
            await sendVerificationEmail(user);
            setMessage(`Verification email sent successfully to ${user.email}.`);
        } catch (err) {
            setError("Failed to send verification email. Please try again later or contact support.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-white text-center px-4">
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
        </div>
    );
}