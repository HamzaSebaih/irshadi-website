import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "../../assets/Animation.json"; // Correctly imported animation data

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
      await login(email, password);
      navigate("/loading");
    } catch (error) {
      setError("The Email address or Password is incorrect");
    }
  };

  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
  
      // Check if it's a new user
      if (result.additionalUserInfo?.isNewUser) {
        navigate('/ProfileCompletionPage');
      } else {
        navigate('/loading');
      }
    } catch (error) {
      setError('Failed to login with Google.');
    }
  }
  

  ;
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-white">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="w-1/2 bg-blue-700 text-white p-12 flex flex-col justify-center items-center relative"
      >
        <Lottie
          animationData={animationData}
          loop
          autoplay
          className="w-3/4 max-w-md"
        />
        <h1 className="text-4xl font-extrabold mb-6 leading-tight mt-6">
          Welcome to <br />
          <span className="text-blue-300">Irashadi Platform</span>
        </h1>
        <p className="text-lg mb-8">Login to continue your journey</p>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="w-1/2 flex items-center justify-center bg-white"
      >
        <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg p-10 w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">
            Welcome back! Please enter your details.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 text-red-700 border border-red-300 p-3 rounded mb-4"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm mb-1 text-gray-600">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm mb-1 text-gray-600">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-blue-500 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                Remember me
              </label>
              <Link to="/ForgetPassPage" className="text-blue-600 text-sm hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* 👇 Added Sign Up link here */}
            <div className="text-center text-sm text-blue-600 mt-4">
              Don’t have an account?{" "}
              <Link to="/SignupPage" className="font-semibold hover:underline">
                Sign up
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Login
            </motion.button>

            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-sm text-gray-500">OR</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition"
            >
              <img src="/search.png" alt="Google" className="w-5 h-5" />
              Continue with Google
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;