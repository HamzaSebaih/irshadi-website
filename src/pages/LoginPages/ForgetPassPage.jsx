import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { getAuth, sendPasswordResetEmail, fetchSignInMethodsForEmail} from "firebase/auth";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import myAnimation from "../../assets/Animation.json";

const ForgetPassPage = () => {
  const [usercred, setUserCred] = useState({
    email: "",
  });
  const [error, setError] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  // method to handle reseting password when user click on the button
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    const validation = {};
  
    // --- client-side validation
    if (!usercred.email) {
      validation.email = "Please enter your email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usercred.email)) {
      validation.email = "Email format is incorrect";
    }
    setError(validation);
    if (Object.keys(validation).length) return;
  
    try {
      await sendPasswordResetEmail(auth, usercred.email);
      setMessage("Password reset link has been sent to your email!");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong, please try again later.");
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
          <h2 className="text-3xl font-bold mb-2 text-black">Reset Password</h2>
          <p className="text-sm text-gray-500 mb-6">Please provide your email below</p>
          {message ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 p-2 bg-green-100 text-green-700 border border-green-300 rounded-md"
            >
              {message}
            </motion.div>
          ) : null}


          <form onSubmit={handleResetPassword} className="space-y-5">
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

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full px-4 py-2 bg-blue-700 text-white rounded-md font-medium shadow hover:bg-blue-800"
            >
              Reset Password
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgetPassPage;