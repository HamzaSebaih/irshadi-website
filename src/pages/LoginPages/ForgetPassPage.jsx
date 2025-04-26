import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from 'react-router';

const ForgotPassword = () => {
  const [formDatas, setFormDatas] = useState({ email: "" });
  const [errs, setErrs] = useState({ main: "", other: "" });
  const [infos, setInfos] = useState("");
  const [sendin, setSendin] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const handleChange = (e) => {
    setFormDatas({ ...formDatas, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErrs({ main: "", other: "" });
    setInfos("");
    setSendin(true);

    // check if email format incorrect
    if (!formDatas.email.includes("@")) {
      setErrs({ ...errs, other: "email not correct i think." });
      setSendin(false);
      return;
    }

    try {
      // try to send reset link 
      await sendPasswordResetEmail(auth, formDatas.email);
      setInfos("we sent email, check inbox plz");
      setTimeout(() => navigate('/login'), 4873); 
      setSendin(false);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        setErrs({ ...errs, main: "cant find user sorry" });
      } else {
        setErrs({ ...errs, main: "some error happen, idk" });
      }
      setSendin(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="hidden md:flex md:w-1/2 bg-blue-600 items-center justify-center p-10">
        <div className="text-center">
          <h1 className="text-4xl text-white font-bold mb-3">reset access lol</h1>
          <p className="text-blue-100">dont worry its happen sometimes</p>
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-5">forgot ur password?</h2>
          <p className="text-gray-600 mb-4">write ur email we send reset link</p>

          {errs.main && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-xs">
              {errs.main}
            </div>
          )}

          {errs.other && (
            <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-4 text-xs">
              {errs.other}
            </div>
          )}

          {infos && (
            <div className="bg-green-100 text-green-800 p-2 rounded mb-4 text-xs">
              {infos}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                email adress
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formDatas.email}
                onChange={handleChange}
                placeholder="someone@something.com"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sendin}
              className={`w-full py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 transition ${sendin ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {sendin ? 'sending....' : 'reset ur pass'}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => { navigate('/login'); }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                go back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
