import React from 'react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';


const StudentImportRecordPage = () => {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
  const [oneTimeCode, setOneTimeCode] = useState(null); //we use this to update the data and get the one time code from the backend 

  const handle_one_time_code_generating = () => { //this fucntion is actviated when we click on the generate button 

    fetchData() //it only calls other funtion
    //I just want to sort things that's why it's indirect calling
  }

  const fetchData = async () => {
    try { //try to avoids any errors
      const token = await user.getIdToken();
      const response = await fetch(backendIp + "/generateCode", { //call the back-end path that will generate code
        method: "POST", //using post
        headers: {
          "Authorization": `${token}`, // we include token to verify the user
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const respObj = await response.json(); //get the response object
      setOneTimeCode(respObj.code); //set its value to show the user
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  

  return (
    <div className="min-h-screen bg-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Import Academic Records
          </h1>
          <p className="text-gray-600">Transfer your academic documents</p>
        </div>

        <div className="space-y-6">
          {/* download card */}
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

          {/* how to use section */}
          <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Use</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Install the extension</li>
              <li>Generate one-time code</li>
              <button
                onClick={handle_one_time_code_generating}
                className="mt-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Generate One-Time Code
              </button>
              <p className="mt-2 px-4 py-2 w-full text-center bg-gray-100 text-gray-700 font-medium rounded-lg">
                {oneTimeCode ? oneTimeCode : "No code generated yet"}
              </p>

              <li>Login to ODUS-Plus</li>
              <li>Go to Student Information</li>
              <li>open the extension and paste the One time code</li>
              <li>Submit</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              Already have the extension? Ignore step 1
            </p>
          </div>


        </div>
      </div>
    </div>
  );
};

export default StudentImportRecordPage;