import { useLocation, useNavigate } from 'react-router-dom';
import ShowCoursesPopUp from '../../components/ShowCoursesPopUp';
import { useEffect, useState } from 'react';

const PlanDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPopUpClicked, setIsPopUpClicked] = useState(false);
  const [parentCourse, setParentCourse] = useState(null);
  const [planID, setPlanID] = useState(null);
  const [planLevel, setPlanLevel] = useState(null);

  const [planData, setPlanData] = useState({ //here when I'm done testing I will use fetch to fetch data from the backend TODO @Senku150
    plan_id: location.state?.plan?.plan_id,
    levels: {
      "Level 1": [
        { courseCode: "CPIT101", prerequisite: "None" },
        { courseCode: "CPIT102", prerequisite: "CPIT101" },
      ],
      "Level 2": [
        { courseCode: "CPIT201", prerequisite: "None" },
        { courseCode: "CPIT202", prerequisite: "CPIT201" },
      ],
      Extra: [
        { courseCode: "CPIT999", prerequisite: "None" },
      ],
    },
  });

  useEffect(() => {
    if (!location.state?.plan?.plan_id) {
      navigate("/AdminStudyPlansPage"); //this where fetching will happnes
    }
    else {
      console.log("fetching WIP")
    }
  }, [location, navigate]);

  const handleClickConfirm = () => {
    navigate("/AdminStudyPlansPage");
  };



  const sortedLevelKeys = Object.keys(planData.levels);

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="text-center my-4">
        <h1 className="text-3xl font-bold">{planData.plan_id}</h1>
      </div>

      {/* Levels */}
      <div className="space-y-8">
        {sortedLevelKeys.map((levelKey) => (
          <div key={levelKey} className="bg-gray-100 rounded-lg p-6 shadow">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">{levelKey}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {planData.levels[levelKey].map((course, index) => (
                <div key={index} className="bg-white p-4 border rounded shadow ">
                  <span className="block text-lg font-medium mb-1">
                    {course.courseCode}
                  </span>
                  <span className=" text-gray-600 block mb-3">
                    Prerequisite: {course.prerequisite}
                  </span>
                  <button
                    onClick={() => {
                      setParentCourse(course)
                      setPlanLevel(null)
                      setPlanID(null)
                      setIsPopUpClicked(true)
                      
                    }
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                  >
                    Select prerequisite
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setPlanLevel(levelKey)
                  setPlanID(location.state?.plan?.plan_id)
                  setParentCourse(null)
                  setIsPopUpClicked(true)
                  
                }}
                className="flex items-center justify-center bg-white p-4 border rounded shadow hover:border-blue-300 hover:shadow-md transition"
              >
                <p className="w-20 h-20 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold shadow">+</p>

              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Button */}
      <div className="mt-6 text-center">
        <button
          onClick={handleClickConfirm}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Confirm
        </button>
      </div>
      {isPopUpClicked && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setIsPopUpClicked(false)} //if he enter outside it will exit
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-96"
            onClick={(e) => e.stopPropagation()} //to prevent the button from being render in the parent elemnts 
          >
            <ShowCoursesPopUp
              parentCourse={parentCourse}
              planID={planID}
              planLevel={planLevel}
            />

          </div>
        </div>
      )}

    </div>
  );
};

export default PlanDetailsPage;
