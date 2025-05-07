import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router';

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
  const MIN_LEVEL = 1;
  const MAX_LEVEL = 16;

  useEffect(() => { // this block of code will work only when entering the page
    //it will load all the avalable plans from the backend server
    // If there's no authenticated user then clear the extra info.
    if (!user) {
      setIsLoading(false);
      setPlans([]);
      return;
    }
    setIsLoading(true);
    const fetchPlans = async () => {
      try {
        const token = await user.getIdToken();
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
        setPlans(data.plans || []);
      } catch (error) {
        console.error("Error fetching plans:", error);
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
        const token = await user.getIdToken();
        const response = await fetch(`${backendIp}/deletePlan`, {
          method: "POST",
          headers: {
            "Authorization": `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan_id: planThatWantToBeDeleted }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }


        setPlanThatWantToBeDeleted(null)
        setUpdatePlanValues(true) //fetch data again
        setDeleteConfirmPopUp(false);
      }
    } catch (error) {
      console.error("Error adding plan:", error); 
      alert(`Failed to delete plan: ${error.message}`);
    }
  };

  const handleAdding = () => { //this will handle the add plan button
    setPlanName('');
    setCurrentLevel(1);
    setPlanRequierdHours("");
    setIsPopUpForAddingClicked(true); //this value if set to true it will load some elements I wrote down below
    //that have the condision if this ture then load it if not then don't load it
  };

  const handleAddPlan = async (e) => { //this will send the plan details to the backend
    e.preventDefault();
    try {
      const token = await user.getIdToken();
      const requiredHoursNum = Number(planRequierdHours);
       if (isNaN(requiredHoursNum) || requiredHoursNum <= 0) {
           alert("Please enter a valid number for Required Hours.");
           return;
       }

      const response = await fetch(`${backendIp}/addPlan`, {
        method: "POST",
        headers: {
          "Authorization": `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_name: planName, levels: currentLevel, required_hours: requiredHoursNum }),
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
      alert(`Failed to add plan: ${error.message}`);
    }
  };



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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h1 className="text-2xl font-semibold text-gray-900">Manage Study Plans</h1>
            <button
              onClick={handleAdding}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Create New Plan
            </button>
          </div>

          {plans.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.plan_id || plan.plan_name}
                  className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                   <div className="p-4">
                        <h2 className="truncate text-lg font-semibold text-primary-dark" title={plan.plan_id || plan.plan_name}>
                           {plan.plan_id || plan.plan_name}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                           Levels: { Object.keys(plan.levels).length-1} | Required Hours: {plan.required_hours ?? 'N/A'}
                        </p>
                    </div>
                    <div className="flex-grow p-4 pt-0">
                         <p className="text-xs text-gray-500">Last Updated: {plan.last_update_date ? new Date(plan.last_update_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                   <div className="flex border-t border-gray-200 bg-gray-50">
                   <button
                       title="Delete Plan"
                       className="flex-1 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-danger"
                       onClick={() => {
                         setPlanThatWantToBeDeleted(plan.plan_id);
                         onDelete();
                       }}
                     >
                       Delete
                     </button>
                     <Link
                       to={`/editPlan`} // here I will pass other elements to the editPlan (passing the whole plan)
                       state={{ plan: plan }} // passing the plan to the next page
                       title="Edit Plan"
                       className="flex-1 border-r border-gray-200 px-4 py-3 text-center text-sm font-medium text-accent-dark hover:bg-accent/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-accent"
                     >
                       Edit
                     </Link>

                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No study plans found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new study plan.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAdding}
                  className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                   Create New Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isPopUpForAddingClicked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPopUpForAddingClicked(false)} // if user clicks outside, it will exit
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} // prevents the button from triggering click event on parent elements
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Add New Plan</h2>
            <form onSubmit={handleAddPlan}>
              <div className="mb-4">
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="title"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter plan title"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="required_hours" className="mb-1 block text-sm font-medium text-gray-700">Required Hours <span className="text-danger">*</span></label>
                <input
                  type="input"
                  id="required_hours"
                  value={planRequierdHours}
                   onChange={(e) => {
                     const value = e.target.value;
                      if (value === "" || /^[1-9][0-9]*$/.test(value)) {
                          setPlanRequierdHours(value);
                      }
                   }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter plan required hours"
                  min="1"
                  required
                />
              </div>

              {/* Plan Levels */}
              <fieldset className="mb-4 rounded-md border border-gray-300 p-4">
                <legend className="px-1 text-sm font-medium text-gray-700">Select Plan Levels <span className="text-danger">*</span></legend>
                <div className="mt-1 flex items-center justify-center gap-4">
                  <button
                    type="button" // prevent form submission
                    onClick={handleDecrement}
                    disabled={currentLevel <= MIN_LEVEL} // disable if at min value
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-xl leading-none">-</span>
                  </button>

                  <span className="min-w-[40px] text-center text-lg font-medium text-gray-900">
                    {currentLevel}
                  </span>

                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={currentLevel >= MAX_LEVEL} // disable if at max value
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-xl leading-none">+</span>
                  </button>
                </div>
              </fieldset>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPopUpForAddingClicked(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Add Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmPopUp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setPlanThatWantToBeDeleted(null);
            setDeleteConfirmPopUp(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="text-gray-700 mb-8 text-lg"> 
              Are you sure you want to delete this plan <strong className='text-danger'>{planThatWantToBeDeleted}</strong>?
            </p>
            <div className="flex justify-end gap-3"> 
              <button
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                onClick={() => {
                  setPlanThatWantToBeDeleted(null);
                  setDeleteConfirmPopUp(false);
                }}
              >
                Cancel
              </button>
              <button
                className="inline-flex justify-center rounded-md border border-transparent bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger-dark focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                onClick={() => {
                  handleDeleteConfirmed();
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