const LoginPage = () => {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <form className="bg-white p-6 rounded-lg shadow-md w-80">
          <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    );
  };
  
  export default LoginPage;