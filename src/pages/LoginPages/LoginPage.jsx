import { useState } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate('/StudentHomePage');
    } catch (error) {
      setError('The Email address or Passwrod is wrong');
    }
  }

  async function handleGoogleLogin() {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        console.log("Sign-in result:", result);
        console.log("Is new user:", result.additionalUserInfo?.isNewUser);

        // Check if the email ends with "kau.edu.sa"
        if (result.user?.email?.endsWith("kau.edu.sa")) {
          if (result.additionalUserInfo?.isNewUser) {
            console.log("Navigating to profile completion page");
            navigate('/ProfileCompletionPage');
        } else {
            console.log("Navigating to student home page");
            navigate('/StudentHomePage');
        }
        }
        else{
          setError("Please ensure to use you'r univerity account")
        }

        
    } catch (error) {
        console.error("Google Login Error:", error);
        setError('Failed to login with Google.');
    }
}



  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-blue-600 p-12 flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-8">
          Welcome to<br />Irashadi Platform
        </h1>
        <div className="flex-1 flex items-center justify-center">
          <img
            src="/api/placeholder/400/400"
            alt="Runner illustration"
            className="w-2/3"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-white p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2">Account Login</h2>
          <p className="text-gray-600 mb-8">
            If you are already a member you can login with your email address and password.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Register Account
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-300 w-full"></div>
              <span className="bg-white px-2 text-sm text-gray-500">Or</span>
              <div className="border-t border-gray-300 w-full"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition duration-200"
            >
              Login with Google
              <img
                src="/search.png"
                alt="Google logo"
                className="w-5 h-5 ml-2"
              />
            </button>


            <div className="text-center">
              <Link to="/ForgetPassPage" className="text-blue-600 hover:text-blue-700 text-sm">
                Forget your password? Click here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;