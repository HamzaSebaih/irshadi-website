import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router";
import { getAuth, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Lottie from "lottie-react";
import myAnimation from "../../assets/Animation.json";

const SignupPage = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", msg: "" });
  const [error, setError] = useState({});
  const [termsChecked, setTermsChecked] = useState(false);

  const { signup, logout } = useAuth();
  const navigate = useNavigate();

  const auth = getAuth();
  const googleAuth = new GoogleAuthProvider();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  // method to check if password requirement were satisfied
  const checkPassword = (pwd) => ({
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    length: pwd.length >= 8,
  });
  // When user type something in any input fields we use state to save it 
  const handleChange = (e) => {
    setUserInfo({...userInfo, [e.target.id]: e.target.value }); // ...prev is spread operator, take the previous state data and re put it as it was
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", msg: "" });
    const validation = {};

    if (!userInfo.firstName.trim()) validation.firstName = "First name is required.";
    if (!userInfo.lastName.trim()) validation.lastName = "Last name is required.";

    if (!userInfo.email) {
      validation.email = "Email is required.";
    } else if (!validateEmail(userInfo.email)) {
      validation.email = "Email format is incorrect.";
    }

    const pwdStatus = checkPassword(userInfo.password);
    if (!userInfo.password) {
      validation.password = "Password can't be empty.";
    } else if (!pwdStatus.uppercase || !pwdStatus.number || !pwdStatus.length) {
      validation.password = "Weak password. Add uppercase, number, and min 8 chars.";
    }

    if (!userInfo.confirmPassword) {
      validation.confirmPassword = "Re-enter your password.";
    } else if (userInfo.password != userInfo.confirmPassword) {
      validation.confirmPassword = "Passwords don't match.";
    }

    if (!termsChecked) {
      validation.terms = "You must agree on terms.";
    }

    setError(validation);

    if (Object.keys(validation).length) return;

    try {
      const res = await signup(userInfo.email, userInfo.password);
      console.log("Signup success, sending email verification...");
      await sendEmailVerification(res.user);
      await logout();

      setMessage({ type: "success", msg: "Check your inbox to verify your email!" });
      setTimeout(() => navigate("/LoginPage"), 3000);
    } catch (err) {
      console.error("Signup went wrong:", err);
      const customMsg = err.code === "auth/email-already-in-use"
        ? "This email is taken."
        : `Something went wrong: ${err.message}`;
      setMessage({ type: "error", msg: customMsg });
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithPopup(auth, googleAuth);
      console.log("Signed in with Google");
      setMessage({ type: "success", msg: "Signed up via Google" });
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error("Google signup error:", err);
      setMessage({ type: "error", msg: `Google signup failed: ${err.message}` });
    }
  };

  const openTermsTab = () => {
    window.open("/terms");
  };

  const pwdValidation = checkPassword(userInfo.password);

  return (
    <div className="flex min-h-screen ">
      {/* Left blue part with the lottie animation*/}
      <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="w-1/2 bg-blue-700 text-white p-12 flex flex-col justify-center items-center">
        <Lottie animationData={myAnimation} loop autoplay className="w-2/4" />
        <h1 className="text-4xl font-extrabold mb-6 leading-tight mt-6">
          Welcome to <br />
          <span className="text-blue-300">Irashadi Platform</span>
        </h1>
        <p className="text-lg mb-8">Create an account to begin your journey</p>
      </motion.div>
      {/* Right white part that contains the form*/}
      <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="w-1/2 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-black">Sign Up</h2>
          <p className="text-sm text-gray-500 mb-6">Join us today! Enter your details below.</p>
          {/* only show the part on the right if notifications.msg is not empty*/}
          {message.msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded mb-4 ${message.type === "error" ? "bg-red-100 text-red-700 border border-red-300 rounded-md" : "bg-green-100 text-green-700 border border-green-300 rounded-md"}`}>
              {message.msg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label htmlFor="firstName" className="text-sm text-gray-600">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={userInfo.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {error.firstName && (
                <p className="text-red-500 text-xs mt-1">{error.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className=" text-sm text-gray-600">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={userInfo.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {error.lastName
                ? <p className="text-red-500 text-xs mt-1">{error.lastName}</p>
                : null
              }
            </div>

            <div>
              <label htmlFor="email" className="text-sm text-gray-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={userInfo.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {error.email
                ? <p className="text-red-500 text-xs mt-1">{error.email}</p>
                : null
              }
            </div>

            <div className="relative">
              <label htmlFor="password" className="text-sm text-gray-600">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={userInfo.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none pr-10"
              />
              <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-[38px] text-gray-500 hover:text-blue-500 transition">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {error.password
                ? <p className="text-red-500 text-xs mt-1">{error.password}</p>
                : null
              }

              {userInfo.password && (
                <ul className="text-xs mt-2 ml-1 space-y-1">
                  <li className={pwdValidation.uppercase ? "text-green-600" : "text-gray-500"}>At least one uppercase letter</li>
                  <li className={pwdValidation.number ? "text-green-600" : "text-gray-500"}>At least one number</li>
                  <li className={pwdValidation.length ? "text-green-600" : "text-gray-500"}>Minimum 8 characters</li>
                </ul>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm text-gray-600">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={userInfo.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {error.confirmPassword
                ? <p className="text-red-500 text-xs mt-1">{error.confirmPassword}</p>
                : null
              }
            </div>

            <div className="flex">
              <div>
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-600">
                  I agree to the <span onClick={openTermsTab} className="text-blue-600 hover:underline cursor-pointer">Terms and Conditions</span>
                </label>
                {error.terms
                ? <p className="text-red-500 text-xs mt-1">{error.terms}</p>
                : null
              }
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="w-full bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 transition">
              Sign Up
            </motion.button>

            <div className="text-center text-sm text-blue-600 mt-4">
              Already registered? <Link to="/" className="font-semibold hover:underline">Login</Link>
            </div>

            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-sm text-gray-500">OR</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleGoogleSignup} type="button" className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition">
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
