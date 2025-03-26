export default function Unauthorized() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-16 rounded-2xl shadow-lg text-center max-w-2xl">
          <h1 className="text-5xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-xl text-gray-600 mt-4">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }
  