import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "../../assets/Animation.json"; // Correctly imported animation data
import ProfileCompletionPage from "./ProfileCompletionPage"; // Assuming path is correct

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await login(email, password);
 
      if(auth.currentUser.emailVerified){
        console.log("email verified")
      }
      navigate("/loading");
    } catch (error) {
      setError("The Email address or Password is incorrect");
    }
  };

  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      //Check if it's a new user
      if (result.additionalUserInfo?.isNewUser) {
        navigate('/ProfileCompletionPage');
      } else {
        navigate('/loading');
      }
    } catch (error) {
      setError('Failed to login with Google.');
    }
  }


  ; // Original semicolon kept
  return (
    // Use consistent light background
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Panel - Use primary theme color */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="hidden w-1/2 flex-col items-center justify-center bg-primary-dark p-12 text-white relative lg:flex" // Use theme color, hide on smaller screens
      >
        <Lottie
          animationData={animationData} // Original animation
          loop
          autoplay
          className="w-3/4 max-w-md"
        />
        <h1 className="mt-6 text-center text-4xl font-extrabold leading-tight">
          Welcome to <br />
          <span className="text-primary-light">Irashadi Platform</span> {/* Use theme color */}
        </h1>
        <p className="mt-4 text-center text-lg">Login to continue your journey</p>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="flex w-full items-center justify-center lg:w-1/2" // Take full width on small screens
      >
        {/* Form Container - Styled consistently */}
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg m-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">Sign In</h2>
          <p className="mb-6 mt-2 text-center text-sm text-gray-500">
            Welcome back! Please enter your details.
          </p>

          {/* Error Message - Use danger theme color */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-md border border-danger bg-danger-light p-3 text-sm text-danger-dark" // Use theme danger colors
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none" // Consistent input style
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none" // Consistent input style + padding for icon
                required
              />
              {/* Show/Hide Password Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-400 hover:text-primary" // Adjusted position & hover color
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" // Styled checkbox
                />
                Remember me
              </label>
              {/* Forgot Password Link - Use accent color */}
              <Link to="/ForgetPassPage" className="text-sm text-accent hover:text-accent-dark hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Sign Up Link - Use accent color */}
            <div className="text-center text-sm text-gray-500"> {/* Changed base text color */}
              Don’t have an account?{" "}
              <Link to="/SignupPage" className="font-medium text-accent hover:text-accent-dark hover:underline">
                Sign up
              </Link>
            </div>

            {/* Login Button - Use primary color */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" // Consistent primary button style
            >
              Login
            </motion.button>

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>


            {/* Google Login Button - Styled as secondary/outline */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogleLogin}
              type="button"
              className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2" // Consistent secondary button style
            >
              <img src="/search.png" alt="Google" className="h-5 w-5" /> {/* Ensure this image path is correct */}
              Continue with Google
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;