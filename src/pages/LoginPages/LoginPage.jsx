import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Lottie from "lottie-react";
import myAnimation from "../../assets/Animation.json";

const LoginPage = () => {
  const [usercred, setUserCred] = useState({
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState({});
  const [message, setMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const googleAuth = new GoogleAuthProvider();

  // method to handle when user submit his credentals
  const submitForm = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const validation = {};
    if (!usercred.email) {
      validation.email = "Email is required."
    }
    if (!usercred.password) {
      validation.password = "Password is required."
    }
    setError(validation);
    // if any input fileds are empty, stop and exit the method (don't login)
    if (Object.keys(validation).length) return;
    try {
      await login(usercred.email, usercred.password);
      navigate("/loading");
    } catch (err) {
      setMessage("Email or password is wrong.");
    }
  };
  // handle Google login when user click the button
  const googleLogin = async () => {
    try {
      await signInWithPopup(auth, googleAuth);
      navigate("/loading");
    } catch (err) {
      setError("Couldn't sign in with Google.");
    }
  };

  const handleChange = (e) => {
    setUserCred({ ...usercred, [e.target.id]: e.target.value }); // ...prev is spread operator, take the previous state data and re put it as it was
  };
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left blue part with the lottie animation*/}
      <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="w-1/2 bg-blue-700 text-white p-12 flex flex-col justify-center items-center">
        <Lottie animationData={myAnimation} loop autoplay className="w-2.5/4" />
        <h1 className="text-4xl font-extrabold mb-6 mt-6 leading-tight">
          Welcome to <br />
          <span className="text-blue-300">Irashadi Platform</span>
        </h1>
        <p className="text-lg mb-8">Glad to have you here</p>
      </motion.div>

      {/* Right white part that contains the form*/}
      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-1/2 flex items-center justify-center"
      >
        <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-3xl font-bold mb-2 text-black">Log In</h2>
          <p className="text-sm text-gray-500 mb-6">Access your account below</p>
          {message ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md"
            >
              {message}
            </motion.div>
          ) : null}


          <form onSubmit={submitForm} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={usercred.email}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              {error.email
                ? <p className="text-red-500 text-xs mt-1">{error.email}</p>
                : null
              }
            </div>

            <div className="relative">
              <label htmlFor="password" className=" mb-1 text-sm font-medium text-gray-700">Password</label>
              <input
                type={showPass ? "text" : "password"}
                id="password"
                value={usercred.password}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"

              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-blue-500 transition"
                
              >
                {showPass ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              {error.password
                ? <p className="text-red-500 text-xs mt-1">{error.password}</p>
                : null
              }
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 "
                />
                Keep me signed in
              </label>
              <Link to="/ForgetPassPage" className="text-sm text-blue-500 hover:underline">Forgot password?</Link>
            </div>

            <div className="text-center text-sm text-gray-500">
              New here?{' '}
              <Link to="/SignupPage" className="font-medium text-blue-500 hover:underline">Create account</Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full px-4 py-2 bg-blue-700 text-white rounded-md font-medium shadow hover:bg-blue-800"
            >
              Sign In
            </motion.button>

            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-sm text-gray-500">OR</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={googleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 bg-white rounded-md text-gray-700 shadow hover:bg-gray-100 "
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