import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router";
import { getAuth, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "../../assets/Animation.json";

const SignupPage = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notifications, setNotifications] = useState({ type: "", msg: "" });
  const [errors, setErrors] = useState({});
  const [termsChecked, setTermsChecked] = useState(false);

  const { signup, logout } = useAuth();
  const navigate = useNavigate();

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  // method to check if password requirement were satisfied
  const checkPassword = (pwd) => ({
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    lengthOk: pwd.length >= 8,
  });

  const handleInput = (e) => {
    setUserInfo(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotifications({ type: "", msg: "" });
    const validation = {};

    if (!userInfo.firstName.trim()) validation.firstName = "First name required.";
    if (!userInfo.lastName.trim()) validation.lastName = "Last name is missing.";

    if (!userInfo.email) {
      validation.email = "Provide an email.";
    } else if (!validateEmail(userInfo.email)) {
      validation.email = "Email format seems wrong.";
    }

    const pwdStatus = checkPassword(userInfo.password);
    if (!userInfo.password) {
      validation.password = "Password can't be empty.";
    } else if (!pwdStatus.uppercase || !pwdStatus.number || !pwdStatus.lengthOk) {
      validation.password = "Weak password. Add uppercase, number, and min 8 chars.";
    }

    if (!userInfo.confirmPassword) {
      validation.confirmPassword = "Re-enter your password.";
    } else if (userInfo.password !== userInfo.confirmPassword) {
      validation.confirmPassword = "Passwords don't match.";
    }

    if (!termsChecked) {
      validation.terms = "Agree to terms first.";
    }

    setErrors(validation);

    if (Object.keys(validation).length) return;

    try {
      const res = await signup(userInfo.email, userInfo.password);
      console.log("Signup success, sending email verification...");
      await sendEmailVerification(res.user);
      await logout();

      setNotifications({ type: "success", msg: "Check your inbox to verify!" });
      setTimeout(() => navigate("/LoginPage"), 3000);
    } catch (err) {
      console.error("Signup went wrong:", err);
      const customMsg = err.code === "auth/email-already-in-use"
        ? "This email is taken."
        : `Something broke: ${err.message}`;
      setNotifications({ type: "error", msg: customMsg });
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithPopup(auth, provider);
      console.log("Signed in with Google");
      setNotifications({ type: "success", msg: "Signed up via Google. Verify email!" });
      await auth.signOut();
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error("Google signup error:", err);
      setNotifications({ type: "error", msg: `Google signup failed: ${err.message}` });
    }
  };

  const openTermsTab = () => {
    window.open("/terms", "_blank");
  };

  const pwdValidation = checkPassword(userInfo.password);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="w-1/2 bg-blue-700 text-white p-12 flex flex-col justify-center items-center">
        <Lottie animationData={animationData} loop autoplay className="w-3/4 max-w-md" />
        <h1 className="text-4xl font-extrabold mb-6 leading-tight mt-6">
          Welcome to <br />
          <span className="text-blue-300">Irashadi Platform</span>
        </h1>
        <p className="text-lg mb-8">Create an account to begin your journey</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="w-1/2 flex items-center justify-center bg-white">
        <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg p-10 w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign Up</h2>
          <p className="text-sm text-gray-500 mb-6">Join us today! Enter your details below.</p>

          {notifications.msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded mb-4 ${notifications.type === "error" ? "bg-red-100 text-red-700 border border-red-300" : "bg-green-100 text-green-700 border border-green-300"}`}>
              {notifications.msg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {['firstName', 'lastName', 'email'].map((id) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm text-gray-600 capitalize">{id.replace(/([A-Z])/, ' $1')}</label>
                <input
                  id={id}
                  type={id === 'email' ? 'email' : 'text'}
                  value={userInfo[id]}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                {errors[id] && <p className="text-red-500 text-xs mt-1">{errors[id]}</p>}
              </div>
            ))}

            <div className="relative">
              <label htmlFor="password" className="block text-sm text-gray-600">Password</label>
              <input
                id="password"
                type={passwordVisible ? "text" : "password"}
                value={userInfo.password}
                onChange={handleInput}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none pr-10"
              />
              <button type="button" onClick={() => setPasswordVisible(prev => !prev)} className="absolute right-3 top-[38px] text-gray-500 hover:text-blue-500 transition">
                {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

              {userInfo.password && (
                <ul className="text-xs mt-2 ml-1 space-y-1">
                  <li className={pwdValidation.uppercase ? "text-green-600" : "text-gray-500"}>At least one uppercase letter</li>
                  <li className={pwdValidation.number ? "text-green-600" : "text-gray-500"}>At least one number</li>
                  <li className={pwdValidation.lengthOk ? "text-green-600" : "text-gray-500"}>Minimum 8 characters</li>
                </ul>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-600">Confirm Password</label>
              <input
                id="confirmPassword"
                type={passwordVisible ? "text" : "password"}
                value={userInfo.confirmPassword}
                onChange={handleInput}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start mt-4">
              <div className="flex items-center h-5">
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
                {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
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
