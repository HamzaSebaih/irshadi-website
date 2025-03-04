import React from 'react';

const AdminHomePage = () => {
  const handleCreateForm = () => {
    alert('Create form clicked!');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6 animate-fadeIn">
      <div className="text-gray-600 text-xl font-light font-sans tracking-wide mb-8">
        Ooops, there's no form to show
      </div>
      <button
        onClick={handleCreateForm}
        className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold
                 normal-case text-base shadow-md transition-all duration-300
                 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg
                 active:translate-y-0 focus:outline-none focus:ring-2
                 focus:ring-blue-500 focus:ring-offset-2"
      >
        Create a Form
      </button>
    </div>
  );
};

export default AdminHomePage;