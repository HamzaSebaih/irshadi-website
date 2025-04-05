import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const AdminStudyPlansPage = () => {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
  const token = user.accessToken //we get the token here 
  const [plans,setPlans] = useState([])
  useEffect(() => {
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
        console.log(data)
        setPlans(data.plans);
      } catch (error) {
        console.error("Error fetching extra info:", error);
        setPlans([]);
      } 
    };

    fetchPlans();
  }, []);

  const onDelete = ()=>{
    console.log("WIP")
  }
  const handleAdding = ()=>{ //async (e) => {
  //   e.preventDefault(); // Prevent default form submission behavior
  //   try {
  //     const response = await fetch('/api/plans', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         name: planName,
  //         levels: Number(numLevels), // Convert numLevels to a number
  //       }),
  //     });
  //     if (response.ok) {
  //       // If the request is successful, trigger the onPlanAdded callback and close the pop-up
  //       onPlanAdded();
  //       onClose();
  //     } else {
  //       console.error('Failed to add plan');
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };
    console.log("WIP")
  }

  // const plans = [
  //   { title: 'IT', updated: 'Last updated 2 days ago' },
  //   { title: 'CS', updated: 'Last updated 1 week ago' },
  //   { title: 'IS', updated: 'Last updated 3 days ago' },
  // ];
  
  return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="mx-auto max-w-7xl w-full">
        <div
          className={`grid ${
            plans.length === 0
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
                {plan.title}
              </h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">{plan.updated}</p>
              </div>
              <div className="flex justify-between mt-4 px-4">
                <Link
                  to={`/editPlan`}
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
              <button className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold hover:bg-blue-700 transition-colors"
              onClick={()=>handleAdding()}>
                +
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStudyPlansPage;