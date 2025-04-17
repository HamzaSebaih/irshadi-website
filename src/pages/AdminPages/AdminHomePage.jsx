import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AdminHomePage = () => {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const [updateTheTable,setUpdateTheTable] = useState(true)
  const [formsTable,setFormTable]=useState([])
  const [formThatWantToBeDeleted,setFormThatWantToBeDeleted]= useState(null)
  const [deleteConfirmPopUp, setDeleteConfirmPopUp] = useState(false)
  const [isPopUpForAddingClicked,setIsPopUpForAddingClicked] =useState(false)
  const [newFormName,setNewFormName] = useState(null)
  const [isLoading,setIsLoading] = useState(true)
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
     useEffect(() => {
        if (!user) return;
        setIsLoading(true); // Start loading
        fetchForms().finally(() => setIsLoading(false)); // Set loading to false when fetch completes
        setUpdateTheTable(false);
      }, [updateTheTable, user]);
    
      // Function to fetch courses from the backend
      const fetchForms = async () => {
        try {
          const response = await fetch(`${backendIp}/getForms`, {
            method: "GET",
            headers: { 
              Authorization: `${user.accessToken}`,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const data = await response.json();
          setFormTable(data.forms);
        } catch (error) {
          console.error("Error fetching courses:", error);
          setFormTable([]);
        }
      };
    
      const onDelete = () => { //this will handle the delete button
        setDeleteConfirmPopUp(true)
      };
  

  return (
    <>
      {!isLoading ? (
        <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
          <div className="mx-auto max-w-7xl w-full">
            <div
              className={`grid ${formsTable.length === 0
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                } gap-6 justify-items-center`}
            >

              {formsTable.map((form, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-fadeIn w-full max-w-xs"
                >
                  <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">
                    {form.form_id}
                  </h2>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 text-sm">{form.last_update_date}</p>
                  </div>
                  <div className="flex justify-between mt-4 px-4">
                    <button
                      onClick={() => {
                        formThatWantToBeDeleted(form.plan_id);
                        onDelete();
                      }}
                      className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-fadeIn w-full max-w-xs flex flex-col justify-center items-center min-h-[200px]">

                {formsTable.length === 0 && (
                  <p className="text-center text-gray-600 mb-4">
                    No Forms available. Click below to create a new Form.
                  </p>
                )}

                <div className="flex justify-center">
                  <button
                    className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold hover:bg-blue-700 transition-colors"
                    onClick={() => setIsPopUpForAddingClicked(true)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-screen">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      )
      }

      {isPopUpForAddingClicked && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setIsPopUpForAddingClicked(false)} // if user clicks outside, it will exit
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-96"
            onClick={(e) => e.stopPropagation()} // prevents the button from triggering click event on parent elements
          >
            <h2 className="text-xl font-bold mb-4">Create a new Form</h2>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Form Name</label>
              <input
                type="text"
                id="title"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter Form Name"
              />
            </div>

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setIsPopUpForAddingClicked(false)}
                className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={console.log("WIP")}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Form
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmPopUp && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={() => {
            setFormThatWantToBeDeleted(null);
            setDeleteConfirmPopUp(false);
          }}
        >
          <div
            className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-700 mb-8 text-2xl">
              Are you sure you want to delete this Form ?
            </p>
            <div className="flex justify-end space-x-4 relative">
              <button
                className="absolute left-0 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                onClick={() => {
                  setFormThatWantToBeDeleted(null);
                  setDeleteConfirmPopUp(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                onClick={() => {
                  console.log("WIP");
                  setFormThatWantToBeDeleted(null);
                  setDeleteConfirmPopUp(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHomePage;