import { useLocation, useNavigate } from 'react-router';
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
        setPlanData(prev => ({
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
        setPopupMessage(isAddedNewCourse.course + " course has been moved from " + isAddedNewCourse.oldLevevl + " To " + isAddedNewCourse.level)

      }
      else {
        setPlanData(prev => ({
          ...prev,
          levels: {
            ...prev.levels,
            [isAddedNewCourse.level]: [...(prev.levels?.[isAddedNewCourse.level] || []), isAddedNewCourse.course]
          }
        }));
        setPopupMessage(isAddedNewCourse.course + " course has been added successfully to " + isAddedNewCourse.level)
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
      } else {
          console.warn("Plan not found after fetch, navigating back.");
          navigate("/AdminStudyPlansPage");
      }

    } catch (error) {
      console.error("Error fetching plan details:", error);
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
      console.log("Delete course response:", data);
    } catch (error) {
      console.error("Error deleting course from plan:", error);
      alert(`Failed to delete course: ${error.message}`);
       fetchCourses();
    }

  };

  const handleClickConfirm = () => {
    navigate("/AdminStudyPlansPage");
  };


  const sortedLevelKeys = planData?.levels ? Object.keys(planData.levels).sort((a, b) => {
    if (a === "Extra") return 1;
    if (b === "Extra") return -1;
    const levelA = parseInt(a.split(" ")[1], 10);
    const levelB = parseInt(b.split(" ")[1], 10);
    if (isNaN(levelA)) return 1;
    if (isNaN(levelB)) return -1;
    return levelA - levelB;
  }) : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!planData) {
    return (
         <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <p className="text-gray-600">Loading plan details...</p>
        </div>
    );
  }


  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">

          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-primary-dark md:text-3xl">{planData.plan_id}</h1>
            <p className="mt-1 text-sm text-gray-500">Manage courses for each level</p>
             <button
                onClick={() => navigate("/AdminStudyPlansPage")}
                className="mt-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 font-medium text-gray-700 shad  ow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
            >
                &larr; Back to Plans
            </button>
          </div>

          <div className="space-y-6">
            {sortedLevelKeys.map((levelKey) => (
              <div key={levelKey} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
                  <h2 className="text-lg font-semibold leading-6 text-gray-800">{levelKey}</h2>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(planData.levels[levelKey] || []).map((course, index) => (
                        <div key={index} className="flex items-center justify-between rounded-md border border-gray-300 bg-white p-3 shadow-sm">
                        <span className="text-sm font-medium text-gray-900">{course}</span>
                        <button
                            onClick={() => {
                                setDeleteCourseFromPlanLevel(levelKey);
                                setDeleteCourseFromPlan(course);
                            }}
                            title={`Delete ${course}`}
                            className="ml-2 rounded-md p-1 text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-1"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        </div>
                    ))}

                    <button
                        onClick={() => {
                        setPlanLevel(levelKey);
                        setPlanID(location.state?.plan?.plan_id);
                        setParentCourse(null);
                        setIsPopUpClicked(true);
                        }}
                        title={`Add course to ${levelKey}`}
                        className="flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-white p-3 text-gray-400 shadow-sm transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                         </svg>
                         <span className="ml-2 text-sm font-medium">Add Course</span>
                    </button>
                    </div>
                </div>
              </div>
            ))}
          </div>


          {isPopUpClicked && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setIsPopUpClicked(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
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
              className="fixed bottom-5 left-1/2 z-50 w-auto -translate-x-1/2 transform cursor-pointer rounded-lg bg-secondary p-4 text-center text-sm font-medium text-gray-800 shadow-lg"
              onClick={() => setPopupMessage(null)}
            >
              {popupMessage}
            </div>
          )}


        </div>
      </div>

    </>
  );
}

export default PlanDetailsPage;