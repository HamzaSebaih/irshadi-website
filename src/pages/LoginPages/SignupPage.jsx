import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "../../assets/Animation.json";

const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const { signup,logout } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) => ({
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    minLength: password.length >= 8,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    const errors = {};

    // Required Fields Check
    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!email) errors.email = "Email is required.";
    else if (!validateEmail(email)) errors.email = "Invalid email format.";

    const pwdValidation = validatePassword(password);
    if (!password) errors.password = "Password is required.";
    else if (!pwdValidation.hasUppercase || !pwdValidation.hasNumber || !pwdValidation.minLength) {
      errors.password = "Password does not meet the requirements.";
    }

    if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const userCredential = await signup(email, password);
      await sendEmailVerification(userCredential.user);
      await logout();
      console.log("Email/Password Signup Successful, Verification Email Sent");
      setSuccessMessage("A verification email has been sent to your email address. Please verify your email.");
      
      setTimeout(() => {
        navigate("/LoginP");
      }, 3000);
    } catch (error) {
      console.error("Email/Password Signup Error:", error.code, error.message);
      const msg =
        error.code === "auth/email-already-in-use"
          ? "This email is already in use."
          : `Failed to create an account: ${error.message}`;
      setError(msg);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("Google Signup Successful");
      setSuccessMessage("A verification email has been sent to your email address. Please verify your email.");
      await getAuth().signOut();
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Google Signup Error:", error.code, error.message);
      setError(`Failed to sign up with Google: ${error.message}`);
    }
  };

  const passwordChecks = validatePassword(password);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-white">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="w-1/2 bg-blue-700 text-white p-12 flex flex-col justify-center items-center"
      >
        <Lottie animationData={animationData} loop autoplay className="w-3/4 max-w-md" />
        <h1 className="text-4xl font-extrabold mb-6 leading-tight mt-6">
          Welcome to <br />
          <span className="text-blue-300">Irashadi Platform</span>
        </h1>
        <p className="text-lg mb-8">Create an account to begin your journey</p>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="w-1/2 flex items-center justify-center bg-white"
      >
        <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg p-10 w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign Up</h2>
          <p className="text-sm text-gray-500 mb-6">Join us today! Please enter your details.</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 text-red-700 border border-red-300 p-3 rounded mb-4"
            >
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-100 text-green-700 border border-green-300 p-3 rounded mb-4"
            >
              {successMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label className="block text-sm text-gray-600">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {validationErrors.firstName && <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm text-gray-600">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {validationErrors.lastName && <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm text-gray-600">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-blue-500 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}

              {/* Password Requirements */}
              {password.length > 0 && (
                <ul className="text-xs mt-2 ml-1 space-y-1">
                  <li className={passwordChecks.hasUppercase ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.hasUppercase ? "✓" : "✗"} At least one uppercase letter
                  </li>
                  <li className={passwordChecks.hasNumber ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.hasNumber ? "✓" : "✗"} At least one number
                  </li>
                  <li className={passwordChecks.minLength ? "text-green-600" : "text-gray-500"}>
                    {passwordChecks.minLength ? "✓" : "✗"} Minimum 8 characters
                  </li>
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-600">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {validationErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Sign Up
            </motion.button>

            {/* Link to Login */}
            <div className="text-center text-sm text-blue-600 mt-4">
              Already have an account?{" "}
              <Link to="/" className="font-semibold hover:underline">
                Login
              </Link>
            </div>

            {/* Google Sign Up */}
            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-sm text-gray-500">OR</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogleSignUp}
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

export default SignupPage;