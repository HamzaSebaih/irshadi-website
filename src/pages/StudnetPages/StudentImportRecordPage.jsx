import React from 'react';

const StudentImportRecordPage = () => {
  return (
    <div className="min-h-screen bg-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Import Academic Records
          </h1>
          <p className="text-gray-600">Securely transfer your academic documents</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Download Card */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-700 mb-2">
                  Get Started
                </h2>
                <p className="text-gray-600 text-sm">
                  Download the extension to begin the import process
                </p>
              </div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
                Download
              </button>
            </div>
          </div>

          {/* How to Use Section */}
          <div className="border-l-4 border-blue-200 pl-4">
            <h3 className="text-blue-800 font-semibold mb-3">How to use</h3>
            <ol className="space-y-2 text-gray-600 list-decimal list-inside">
              <li>Install the extension</li>
              <li>Login with your university credentials</li>
              <li>Select documents to upload</li>
              <li>Verify and submit</li>
            </ol>
          </div>

          {/* Existing Users Section */}
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              Already have the extension?{' '}
              <a href="#" className="font-semibold hover:text-blue-600">
                Ignore step 1
              </a>
            </p>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default StudentImportRecordPage;