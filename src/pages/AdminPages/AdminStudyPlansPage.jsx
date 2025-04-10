import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const AdminStudyPlansPage = () => {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
  const token = user.accessToken //we get the token here 
  const [plans, setPlans] = useState([]);
  const [isPopUpForAddingClicked, setIsPopUpForAddingClicked] = useState(false);
  const [planName, setPlanName] = useState(''); // State for the title input
  const [updatePlanValues, setUpdatePlanValues] = useState(false) //this to update the plan values when we add a new plan
  const [currentLevel, setCurrentLevel] = useState(1); //this for the UI

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
            "Authorization": `${token}`,
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
    };

    fetchPlans();
    setUpdatePlanValues(false)
  }, [updatePlanValues]);
  //END OF LOADING PLANS -------------------------------------------------------------

  const onDelete = () => { //this will handle the delete button
    console.log("WIP");
  };

  const handleAdding = () => { //this will handle the add plan button
    setIsPopUpForAddingClicked(true); //this value if set to true it will load some elements I wrote down below 
    //that have the condision if this ture then load it if not then don't load it
  };

  const handleAddPlan = async () => { //this will send the plan details to the backend
    try {
      const response = await fetch(`${backendIp}/addPlan`, {
        method: "POST",
        headers: {
          "Authorization": `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_name: planName, levels: currentLevel }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data)
      setIsPopUpForAddingClicked(false); //change this to false to remove the pop up
      setPlanName(''); //empty those values 
      setCurrentLevel(1);
      setUpdatePlanValues(true)
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
                  to={`/editPlan`} //here I will pass other elemnts to the editPlan (passing the whole plan)
                  state={{ plan: plan}} //passing the plan to the next page
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-800 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => onDelete(index)}
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
      {isPopUpForAddingClicked && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setIsPopUpForAddingClicked(false)} //if he enter outside it will exit
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-96"
            onClick={(e) => e.stopPropagation()} //to prevent the button from being render in the parent elemnts 
          >
            <h2 className="text-xl font-bold mb-4">Add New Plan</h2>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                id="title"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)} // Fixed syntax error here
                className="w-full p-2 border rounded"
                placeholder="Enter plan title"
              />

            </div>

            {/* START of Plan levels ------------------------------- */}
            <fieldset className="border p-4 rounded"> 
              <legend className="text-lg font-semibold px-2">Select Plan Levels</legend>

              <div className="flex items-center justify-center gap-3 mt-2"> {/* Layout container */}

                <button
                  type="button" // Prevent form submission
                  onClick={handleDecrement}
                  disabled={currentLevel <= MIN_LEVEL} // Disable if at min value
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>

                <span
                  className="text-xl font-medium px-4 py-1 border rounded min-w-[50px] text-center" // Styling for the number display
                >
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
            {/* END of Plan levels-------------------------------------- */}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsPopUpForAddingClicked(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudyPlansPage;