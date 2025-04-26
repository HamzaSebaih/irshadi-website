import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "../../assets/Animation.json";
import ProfileCompletionPage from "./ProfileCompletionPage";

const LoginPage = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const googleAuth = new GoogleAuthProvider();

  // method to handle when user submit his credentals
  const submitForm = async (event) => {
    event.preventDefault();
    setLoginError("");
    try {
      await login(userEmail, userPassword);
      if (auth.currentUser?.emailVerified) {
        console.log("Email verified!");
      }
      navigate("/loading");
    } catch (err) {
      console.error("Login failed", err);
      setLoginError("Wrong credentials. Check and try again.");
    }
  };
  // handle Google login when user click the button
  const googleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuth);
      if (res.additionalUserInfo?.isNewUser) {
        navigate("/ProfileCompletionPage");
      } else {
        navigate("/loading");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setLoginError("Couldn't sign in with Google.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-primary-dark text-white p-10"
      >
        <Lottie animationData={animationData} loop autoplay className="w-3/4 max-w-md" />
        <h1 className="mt-6 text-4xl font-bold text-center">Welcome to <span className="text-primary-light">Irashadi</span></h1>
        <p className="mt-4 text-lg text-center">Glad to have you here!</p>
      </motion.div>

      {/* Right Panel - Form */}
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex w-full lg:w-1/2 items-center justify-center"
      >
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md border border-gray-200 m-4">
          <h2 className="text-2xl font-semibold text-center text-gray-800">Sign In</h2>
          <p className="text-center text-sm text-gray-500 mt-2 mb-6">Access your account below</p>

          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-danger-light border border-danger text-danger-dark rounded-md text-sm"
            >
              {loginError}
            </motion.div>
          )}

          <form onSubmit={submitForm} className="space-y-5">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
              <input
                type={showPass ? "text" : "password"}
                id="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-400 hover:text-primary"
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                Keep me signed in
              </label>
              <Link to="/ForgetPassPage" className="text-sm text-accent hover:underline">Forgot password?</Link>
            </div>

            <div className="text-center text-sm text-gray-500">
              New here?{' '}
              <Link to="/SignupPage" className="font-medium text-accent hover:underline">Create account</Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded-md font-medium shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Sign In
            </motion.button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={googleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 bg-white rounded-md text-gray-700 shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
            >
              <img src="/search.png" alt="Google" className="h-5 w-5" />
              Continue with Google
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;