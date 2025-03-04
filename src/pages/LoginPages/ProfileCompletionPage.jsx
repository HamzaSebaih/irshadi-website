import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const ProfileCompletionPage = () => {
  const [userProfile, setUserProfile] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserProfile((prev) => ({
          ...prev,
          fullName: user.displayName || "",
          email: user.email || ""
        }));
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserProfile((prev) => ({
      ...prev,
      [name]: value
    }));
    if (name === "password") {
      validatePassword(value);
      setPasswordTouched(true);
    }
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    setPasswordValid(regex.test(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordValid && userProfile.password === userProfile.confirmPassword && agreeTerms) {
      try {
        navigate("/StudentHomePage");
      } catch (error) {
        console.error("Error saving profile:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="fullName" value={userProfile.fullName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={userProfile.email} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" readOnly />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" value={userProfile.password} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
            {passwordTouched && <p className={`mt-1 text-sm ${passwordValid ? "text-green-600" : "text-red-600"}`}>Password must be at least 8 characters long, contain an uppercase letter, lowercase letter, a number, and a special character.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" name="confirmPassword" value={userProfile.confirmPassword} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="terms" checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="terms" className="ml-2 block text-sm text-blue-600 cursor-pointer" onClick={() => setShowTerms(true)}>I agree to the Terms and Conditions</label>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={!passwordValid || !agreeTerms || userProfile.password !== userProfile.confirmPassword} className={`w-full bg-blue-600 text-white py-2 px-8 rounded-md transition duration-200 ${passwordValid && agreeTerms && userProfile.password === userProfile.confirmPassword ? "hover:bg-blue-700" : "opacity-50 cursor-not-allowed"}`}>Continue</button>
          </div>
        </form>
      </div>

      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold">Terms and Conditions</h3>
            <p className="mt-4 text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vehicula eget quam ac pharetra. Fusce feugiat vehicula justo...</p>
            <button className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700" onClick={() => setShowTerms(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionPage;
