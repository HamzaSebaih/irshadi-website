import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { data } from "react-router-dom";

const ShowCoursesPopUp = ({ parentCourse, planID, planLevel, setIsAddedNewCourse, setIsLoadingForPage }) => {
  const backendIp = "http://127.0.0.1:5000"; // Backend IP domain
  const [allCourses, setAllCourses] = useState([]); // State for the list of courses
  const [isCreatingCourse, setIsCreatingCourse] = useState(false); // Toggle form visibility
  const [department, setDepartment] = useState(""); // Form field: department
  const [courseNumber, setCourseNumber] = useState(""); // Form field: course_number
  const [courseName, setCourseName] = useState(""); // Form field: course_name
  const [hours, setHours] = useState(""); // Form field: hours
  const [updateTheTable, setUpdateTheTable] = useState(false); // Trigger table update
  const [localParentCourse, setLocalParentCourse] = useState(parentCourse); // Local parent course state
  const [isLoading, setIsLoading] = useState(true);
  const [courseThatWantToBeDeleted, setCourseThatWantToBeDeleted] = useState(null)
  const { user } = useAuth(); // Get current user from AuthContext
  const token = user?.accessToken; // Access token for backend requests

  // Fetch courses when updateTheTable changes
  useEffect(() => {
    if (!user) return;
    fetchCourses().finally(() => setIsLoading(false)); // Set loading to false when fetch completes
    setUpdateTheTable(false);
  }, [updateTheTable, user]);

  // Function to fetch courses from the backend
  const fetchCourses = async () => {
    setIsLoading(true); // Start loading
    try {
      const response = await fetch(`${backendIp}/getCourses`, {
        method: "GET",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setAllCourses(data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setAllCourses([]);
    }
  };

  // Show the create course form
  const handleCreateNewCourse = () => {
    setIsCreatingCourse(true);
  };

  // Handle form submission to create a new course
  const handleSaveNewCourse = async (e) => {
    e.preventDefault();
    const newCourse = {
      department,
      course_number: parseInt(courseNumber),
      course_name: courseName,
      hours: parseInt(hours),
    };
    try {
      const response = await fetch(`${backendIp}/addCourse`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCourse),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      setUpdateTheTable(true); // Trigger table update
      setIsCreatingCourse(false); // Hide form
      setDepartment(""); // Reset form
      setCourseNumber("");
      setCourseName("");
      setHours("");
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course. Please try again.");
    }
  };
  
  useEffect(() => {
    if(courseThatWantToBeDeleted){
    handleDeleteCourse().finally(() => {
      setCourseThatWantToBeDeleted(null)
    });
  }
  }, [courseThatWantToBeDeleted]);

  const handleDeleteCourse = async () => {
    const courseThatWantToBeDeletedTemp = courseThatWantToBeDeleted.department +"-"+courseThatWantToBeDeleted.course_number
    try {
      const response = await fetch(`${backendIp}/deleteCourse`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseThatWantToBeDeletedTemp),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      setUpdateTheTable(true); 
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course. Please try again.");
    }
  };


  // Placeholder handler for adding a course to a plan
  const handleAddCourseToPlan = async (course, planID, planLevel) => {
    // setIsLoadingForPage(true)
    let fixedPlanLevel = planLevel
    const course_ide = course.department + "-" + course.course_number
    console.log(`Adding ${course_ide} to plan ${planID} at level ${planLevel}`);
    if (planLevel.startsWith("Level")) {
      fixedPlanLevel = parseInt(planLevel.replace("Level", "").trim());
    }
    try {
      const response = await fetch(`${backendIp}/addCourseToPlanLevel`, {
        method: "POST",
        headers: {
          "Authorization": `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_name: planID, level_identifier: fixedPlanLevel, course_id: course_ide }),
      });
      const data = await response.json(); // Parse the response body as JSON
      console.log(data)
      if(data.frontEndMessage == 101 ){
        setIsAddedNewCourse({level: planLevel,course:course_ide,alreadyAdded:true})
      }
      else if(data.frontEndMessage ==102){
        setIsAddedNewCourse({level: planLevel,course:course_ide,moved:true,oldLevevl:data.old_level_key})
      }
      else{
        setIsAddedNewCourse({level: planLevel,course:course_ide})
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

    } catch (error) {
      console.error("Error adding plan:", error);
    }
    finally {
      // setIsLoadingForPage(false)
    }
  };

  // Placeholder handler for adding a prerequisite
  const handleAddingPrerequisite = async (course, localParentCourse) => {
    setUpdateTheTable(true); // Trigger table update
    const parent_course_id = localParentCourse.department + "-" + localParentCourse.course_number
    const prerequisite_course_id = course.department + "-" + course.course_number
    try {
      const response = await fetch(`${backendIp}/addCoursePre`, {
        method: "POST",
        headers: {
          "Authorization": `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: parent_course_id, prerequisite: prerequisite_course_id }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

    } catch (error) {
      console.error("Error adding plan:", error);
    }
    finally {
      setLocalParentCourse(null)
    }
  };

  // Dynamic header based on context
  let header;
  if (localParentCourse) {
    header = (
      <h2 className="text-xl font-semibold mb-4">
        Select a course to add as prerequisite to {localParentCourse.department + localParentCourse.course_number}
      </h2>
    );
  } else if (planID) {
    header = (
      <h2 className="text-xl font-semibold mb-4">
        Select a course to add to plan {planID}
      </h2>
    );
  } else {
    header = <h2 className="text-xl font-semibold mb-4">Available Courses</h2>;
  }

  return (
    <div className="p-6 bg-white rounded shadow-md w-[50vw] h-[50vh] flex flex-col">
      {isCreatingCourse ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
          <form onSubmit={handleSaveNewCourse}>
            <div className="mb-4">
              <label className="block text-gray-700">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Ex. CPIT"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Course Number</label>
              <input
                type="text"
                value={courseNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]*$/.test(value)) {
                    setCourseNumber(value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded"
                inputMode="numeric"
                placeholder="Ex. 250"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Hours</label>
              <input
                type="number"
                value={hours}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || Number(value) >= 1) {
                    setHours(value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Ex. 3"
                min="1"
                max="15"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Course Name</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Ex. Software Engineering 1"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingCourse(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded"
              >
                Save
              </button>
            </div>
          </form>
        </>
      ) : isLoading ? (
        <p className="text-gray-600">Loading courses...</p> // NEW: Loading indicator
      ) : (
        <>
          {header}
          <div className="flex-grow overflow-y-auto"> {/* NEW: Scrollable container */}
            <ul className="space-y-2">
              {allCourses.map((course) => (
                <li
                  key={course.department + course.course_number}
                  className="bg-white p-4 border border-gray-200 rounded shadow hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-800">
                    {course.department}{course.course_number}
                  </h3>
                  {course.prerequisites && course.prerequisites.length > 0 ? (
                    <ul className="mt-2 ml-5 list-disc text-sm text-gray-700">
                      {course.prerequisites.map((prereq, index) => (
                        <li key={index}>{prereq}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">No prerequisites</p>
                  )}
                  <div className="mt-4 flex justify-end space-x-2">
                  {(planID && !localParentCourse) && (
                      <button
                        onClick={() => handleAddCourseToPlan(course, planID, planLevel)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                      >
                        Add to Plan
                      </button>
                    )}

                    {!localParentCourse && (
                      <>
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
                          onClick={() => setLocalParentCourse(course)}
                        >
                          Add prerequisite
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
                          onClick={() => setCourseThatWantToBeDeleted(course)}
                        >
                          Delete Course
                        </button>
                      </>
                    )}


                    {localParentCourse && !(localParentCourse === course) && (
                      <button
                        onClick={() => handleAddingPrerequisite(course, localParentCourse)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                      >
                        Add as Prerequisite
                      </button>
                    )}

                  </div>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={handleCreateNewCourse}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded"
          >
            Create New Course
          </button>
          {localParentCourse && <button //if there is set prerequist then show this button else hide it
            onClick={() => {
              setLocalParentCourse(null)
            }}
            className="mt-4 ml-8 bg-gray-400 hover:bg-gray-500 text-black text-sm py-2 px-4 rounded"
          >
            Cancel
          </button>}
        </>
      )}
    </div>
  );
};

export default ShowCoursesPopUp;