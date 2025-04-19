import { useLocation, useNavigate } from 'react-router-dom';
import ShowCoursesPopUp from '../../components/ShowCoursesPopUp';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PlanDetailsPage = () => {
  const backendIp = "http://127.0.0.1:5000"; // Backend IP domain
  const navigate = useNavigate();
  const location = useLocation();
  const [isPopUpClicked, setIsPopUpClicked] = useState(false);
  const [parentCourse, setParentCourse] = useState(null);
  const [planID, setPlanID] = useState(null);
  const [planLevel, setPlanLevel] = useState(null);
  const dataFromLocation = location.state
  const [planData, setPlanData] = useState(dataFromLocation?.plan);
  const [isAddedNewCourse, setIsAddedNewCourse] = useState(null)
  const [deleteCourseFromPlan, setDeleteCourseFromPlan] = useState(null);
  const [deleteCourseFromPlanLevel, setDeleteCourseFromPlanLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState();
  const { user } = useAuth(); // Get current user from AuthContext

  useEffect(() => {
    if (!location.state?.plan?.plan_id) {
      navigate("/AdminStudyPlansPage"); //this where fetching will happnes
    }
    else {
      setIsLoading(true)
      fetchCourses().finally(() => {
        setIsPopUpClicked(false)
        setIsLoading(false)
      });
    }

  }, [location, navigate, user]);

  useEffect(() => {

    if (isAddedNewCourse) {
      console.log(isAddedNewCourse)
      if (isAddedNewCourse?.alreadyAdded) {
        setPopupMessage(isAddedNewCourse.course + " course is already in the "+isAddedNewCourse.level)
      }
      else if (isAddedNewCourse?.moved) {
        setPlanData(prev => ({ //here we delete from old level then we add to the new level
          ...prev,
          levels: {
            ...prev.levels,
            [isAddedNewCourse.oldLevevl]: prev.levels[isAddedNewCourse.oldLevevl].filter(course => course !== isAddedNewCourse.course)
          }
        }));

        setPlanData(prev => ({
          ...prev,
          levels: {
            ...prev.levels,
            [isAddedNewCourse.level]: [...prev.levels[isAddedNewCourse.level], isAddedNewCourse.course]
          }
        }));
        setPopupMessage(isAddedNewCourse.course + "course has been moved from " + isAddedNewCourse.oldLevevl + " To " + isAddedNewCourse.level)

      }
      else {
        setPlanData(prev => ({
          ...prev,
          levels: {
            ...prev.levels,
            [isAddedNewCourse.level]: [...prev.levels[isAddedNewCourse.level], isAddedNewCourse.course]
          }
        }));
        setPopupMessage(isAddedNewCourse.course + "course has been added successfully to " + isAddedNewCourse.level)
      }

      setIsAddedNewCourse(null)
    }
  }, [isAddedNewCourse]);

  const fetchCourses = async () => {
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
      const matchingPlan = data.plans.find(plan => plan.plan_id === location.state?.plan?.plan_id);
      if (matchingPlan) {
        setPlanData(matchingPlan);
      }

    } catch (error) {
      console.error("Error fetching extra info:", error);
    }

  };

  useEffect(() => {
    if (popupMessage) {
      const timer = setTimeout(() => {
        setPopupMessage(null);
      }, 3000); //3 sec for the upper message to disaper
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);

  useEffect(() => {
    if (deleteCourseFromPlan && deleteCourseFromPlanLevel) {
      //setIsLoading(true)

      setPlanData(prev => ({
        ...prev,
        levels: {
          ...prev.levels,
          [deleteCourseFromPlanLevel]: prev.levels[deleteCourseFromPlanLevel].filter(course => course !== deleteCourseFromPlan)
        }
      }));
      sendDeleteCourse().finally(() => {
        //setIsLoading(false)
        setDeleteCourseFromPlan(null);
        setDeleteCourseFromPlanLevel(null);
      });
    }
  }, [deleteCourseFromPlan, deleteCourseFromPlanLevel]);
  const sendDeleteCourse = async () => {
    let fixedPlanLevel = deleteCourseFromPlanLevel;
    if (fixedPlanLevel.startsWith("Level")) {
      fixedPlanLevel = parseInt(fixedPlanLevel.replace("Level", "").trim());
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/deleteCourseFromPlan`, {
        method: "POST",
        headers: {
          "Authorization": `${token}`,
          "Content-Type": "application/json",
        }, body: JSON.stringify({ plan_id: location.state?.plan?.plan_id, level_identifier: fixedPlanLevel, course_id: deleteCourseFromPlan }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
    } catch (error) {
      console.error("Error fetching extra info:", error);
    }

  };

  const handleClickConfirm = () => {
    navigate("/AdminStudyPlansPage");
  };


  const sortedLevelKeys = Object.keys(planData.levels).sort((a, b) => {
    if (a === "Extra") return 1;
    if (b === "Extra") return -1;
    return parseInt(a.split(" ")[1], 10) - parseInt(b.split(" ")[1], 10);
  })

  return (
    <>
      {!isLoading ? (
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
                  <h2 className="text-3xl font-semibold">{levelKey}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {planData.levels[levelKey].map((course, index) => (
                    <div key={index} className="bg-white p-6 border rounded shadow">
                      <div className="bg-white p-4 border rounded shadow flex justify-between items-center">
                        <span className="text-lg font-medium">{course}</span>
                        <button
                          onClick={() => {
                            setDeleteCourseFromPlanLevel(levelKey)
                            setDeleteCourseFromPlan(course);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setPlanLevel(levelKey);
                      setPlanID(location.state?.plan?.plan_id);
                      setParentCourse(null);
                      setIsPopUpClicked(true);
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
              onClick={() => setIsPopUpClicked(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}>
                <ShowCoursesPopUp
                  parentCourse={parentCourse}
                  planID={planID}
                  planLevel={planLevel}
                  setIsAddedNewCourse={setIsAddedNewCourse}
                  setIsLoadingForPage={setIsLoading}
                />
              </div>
            </div>

          )}

          {popupMessage && (
            <div
              className="fixed top-0 mt-4 left-1/2 transform -translate-x-1/2 
                       bg-white p-5 
                       rounded-lg 
                       shadow-xl
                       z-50 cursor-pointer"
              onClick={() => setPopupMessage(null)} 
            >

              <h1 className="text-xl font-semibold text-center">
                {popupMessage}
              </h1>

            </div>
          )}


        </div>
      ) : (
        <div className="flex justify-center items-center h-screen">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}

export default PlanDetailsPage;
