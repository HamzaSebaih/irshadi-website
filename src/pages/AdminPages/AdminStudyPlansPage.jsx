import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const AdminStudyPlansPage = () => {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
  const [plans, setPlans] = useState([]);
  const [isPopUpForAddingClicked, setIsPopUpForAddingClicked] = useState(false);
  const [planName, setPlanName] = useState(''); // State for the title input
  const [updatePlanValues, setUpdatePlanValues] = useState(false) //this to update the plan values when we add a new plan
  const [currentLevel, setCurrentLevel] = useState(1); //this for the UI
  const [planRequierdHours, setPlanRequierdHours] = useState("")
  const [deleteConfirmPopUp, setDeleteConfirmPopUp] = useState(false)
  const [planThatWantToBeDeleted, setPlanThatWantToBeDeleted] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { // this block of code will work only when entering the page 
    //it will load all the avalable plans from the backend server 
    // If there's no authenticated user then clear the extra info.
    if (!user) {
      return;
    }
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${backendIp}/getPlans`, {
          method: "GET",
          headers: {
            "Authorization": `${user.accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setPlans(data.plans);
      } catch (error) {
        console.error("Error fetching extra info:", error);
        setPlans([]);
      }
      finally {
        setIsLoading(false)
      }
    };

    fetchPlans();
    setUpdatePlanValues(false)
  }, [updatePlanValues, user]);
  //END OF LOADING PLANS -------------------------------------------------------------

  const onDelete = () => { //this will handle the delete button
    setDeleteConfirmPopUp(true)
  };

  const handleDeleteConfirmed = async () => { //this will send the plan details to the backend
    try {
      if (planThatWantToBeDeleted) {
        const response = await fetch(`${backendIp}/deletePlan`, {
          method: "POST",
          headers: {
            "Authorization": `${user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan_id: planThatWantToBeDeleted }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }


        setPlanThatWantToBeDeleted(null)
        setUpdatePlanValues(true) //fetch data again
      }
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const handleAdding = () => { //this will handle the add plan button 
    setIsPopUpForAddingClicked(true); //this value if set to true it will load some elements I wrote down below 
    //that have the condision if this ture then load it if not then don't load it
  };

  const handleAddPlan = async () => { //this will send the plan details to the backend
    try {
      // console.log("planName: "+planName+ " currentLevel "+currentLevel+" required_hours "+ planRequierdHours)
      const response = await fetch(`${backendIp}/addPlan`, {
        method: "POST",
        headers: {
          "Authorization": `${user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_name: planName, levels: currentLevel, required_hours: planRequierdHours }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setIsPopUpForAddingClicked(false); //change this to false to remove the pop up
      setPlanName(''); //empty those values 
      setCurrentLevel(1); //empty those values 
      setPlanRequierdHours("") //empty those values 
      setUpdatePlanValues(true) //fetch data again
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const MIN_LEVEL = 1;
  const MAX_LEVEL = 16;

  const handleDecrement = () => {
    if (currentLevel > MIN_LEVEL) {
      setCurrentLevel(currentLevel - 1);
    }
  };

  const handleIncrement = () => {
    if (currentLevel < MAX_LEVEL) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  return (
    <>
      {!isLoading ? (
        <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
          <div className="mx-auto max-w-7xl w-full">
            <div
              className={`grid ${plans.length === 0
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                } gap-6 justify-items-center`}
            >
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-fadeIn w-full max-w-xs"
                >
                  <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">
                    {plan.plan_id}
                  </h2>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 text-sm">{plan.last_update_date}</p>
                  </div>
                  <div className="flex justify-between mt-4 px-4">
                    <Link
                      to={`/editPlan`} // here I will pass other elements to the editPlan (passing the whole plan)
                      state={{ plan: plan }} // passing the plan to the next page
                      className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-800 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        setPlanThatWantToBeDeleted(plan.plan_id);
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
                {plans.length === 0 && (
                  <p className="text-center text-gray-600 mb-4">
                    No plans available. Click below to add a new plan.
                  </p>
                )}
                <div className="flex justify-center">
                  <button
                    className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold hover:bg-blue-700 transition-colors"
                    onClick={() => handleAdding()}
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
            <h2 className="text-xl font-bold mb-4">Add New Plan</h2>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                id="title"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter plan title"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="required_hours" className="block text-gray-700 mb-2">Required Hours</label>
              <input
                type="text"
                id="required_hours"
                value={planRequierdHours}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]*$/.test(value)) { // prevents entering non-numbers
                    setPlanRequierdHours(parseInt(value));
                  }
                }}
                className="w-full p-2 border rounded"
                placeholder="Enter plan required hours"
              />
            </div>

            {/* Plan Levels */}
            <fieldset className="border p-4 rounded">
              <legend className="text-lg font-semibold px-2">Select Plan Levels</legend>
              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  type="button" // Prevent form submission
                  onClick={handleDecrement}
                  disabled={currentLevel <= MIN_LEVEL} // Disable if at min value
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>

                <span className="text-xl font-medium px-4 py-1 border rounded min-w-[50px] text-center">
                  {currentLevel}
                </span>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={currentLevel >= MAX_LEVEL}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </fieldset>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsPopUpForAddingClicked(false)}
                className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlan}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmPopUp && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={() => {
            setPlanThatWantToBeDeleted(null);
            setDeleteConfirmPopUp(false);
          }}
        >
          <div
            className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-700 mb-8 text-2xl">
              Are you sure you want to delete this plan?
            </p>
            <div className="flex justify-end space-x-4 relative">
              <button
                className="absolute left-0 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                onClick={() => {
                  setPlanThatWantToBeDeleted(null);
                  setDeleteConfirmPopUp(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                onClick={() => {
                  handleDeleteConfirmed();
                  setDeleteConfirmPopUp(false);
                  setPlanThatWantToBeDeleted(null);
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
}


export default AdminStudyPlansPage;