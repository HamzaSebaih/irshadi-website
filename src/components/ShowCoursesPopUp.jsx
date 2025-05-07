import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const ShowCoursesPopUp = ({ parentCourse, planID, planLevel, setIsAddedNewCourse }) => {
  const backendIp = "http://127.0.0.1:5000"; // Backend IP domain
  const [allCourses, setAllCourses] = useState([]);
  const [allCoursesBackUp,setAllCoursesBackUp] = useState([])
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [department, setDepartment] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [courseName, setCourseName] = useState("");
  const [hours, setHours] = useState("");
  const [updateTheTable, setUpdateTheTable] = useState(false);
  const [localParentCourse, setLocalParentCourse] = useState(parentCourse);
  const [isLoading, setIsLoading] = useState(true);
  const [courseThatWantToBeDeleted, setCourseThatWantToBeDeleted] = useState(null)
  const [prerequisitesCourseThatWantToBeDeleted, setPrerequisitesCourseThatWantToBeDeleted] = useState(null)
  const [parentPrerequisitesCourseThatWantToBeDeleted, setParentPrerequisitesCourseThatWantToBeDeleted] = useState(null)
  const [search,setSearch] = useState("")
  const { user } = useAuth(); // Get current user from AuthContext

  // Fetch courses when updateTheTable changes
  useEffect(() => {
    if (!user) return;
    fetchCourses().finally(() => setIsLoading(false)); // Set loading to false when fetch completes
    setUpdateTheTable(false);
  }, [updateTheTable, user]);

  useEffect(() => {
    const searchToLower= search.toLowerCase()
    setAllCourses(allCoursesBackUp.filter((course) => {
      const courseId = (course.course_id).toLowerCase();
      return courseId.includes(searchToLower);}))
  }, [search]);


  // Function to fetch courses from the backend
  const fetchCourses = async () => {
    setIsLoading(true); // Start loading
    try {
      const token = await user.getIdToken();
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
      setAllCoursesBackUp(data.courses)
    } catch (error) {
      console.error("Error fetching courses:", error);
      setAllCourses([]);
      setAllCoursesBackUp([])
    } finally {
      setIsLoading(false);
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
      const token = await user.getIdToken();
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
    if (courseThatWantToBeDeleted) {
      handleDeleteCourse().finally(() => {
        setCourseThatWantToBeDeleted(null)
      });
    }
  }, [courseThatWantToBeDeleted]);

  const handleDeleteCourse = async () => {
    const courseThatWantToBeDeletedTemp = courseThatWantToBeDeleted.department + "-" + courseThatWantToBeDeleted.course_number
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/deleteCourse`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: courseThatWantToBeDeletedTemp }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(`Failed to Delete course. Please remove any courses that has this course as prerequisite First.`);
        }
        else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      setUpdateTheTable(true);
      alert(courseThatWantToBeDeletedTemp + " course has been delete successfully");
    } catch (error) {
      console.error("Error Deleteing course:", error);
      alert(error);
    }
  };

  useEffect(() => {
    if (prerequisitesCourseThatWantToBeDeleted) {
      handleDeletingPrerequisite().finally(() => {
        setPrerequisitesCourseThatWantToBeDeleted(null)
        setParentPrerequisitesCourseThatWantToBeDeleted(null)
      });
    }
  }, [prerequisitesCourseThatWantToBeDeleted])

  const handleDeletingPrerequisite = async () => {
    // Store IDs before the async call might clear them in the finally block
    const prerequisiteIdToDelete = prerequisitesCourseThatWantToBeDeleted;
    const parentCourseIdOfDeletedPrereq = parentPrerequisitesCourseThatWantToBeDeleted;

    if (!prerequisiteIdToDelete || !parentCourseIdOfDeletedPrereq) {
      console.error("Missing prerequisite or parent course ID for deletion.");
      return; // Exit if IDs are not set
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/deleteCoursePre`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prerequisite_id: prerequisiteIdToDelete,
          course_id: parentCourseIdOfDeletedPrereq
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to Delete course prerequisite. Status: ${response.status}`);
      }

      // update UI Locally
      setAllCourses(prevCourses =>
        prevCourses.map(course => {
          const currentCourseId = `${course.department}-${course.course_number}`;
          // find the parent course whose prerequisite was deleted
          if (currentCourseId === parentCourseIdOfDeletedPrereq) {
            // return a new course object with the prerequisite filtered out
            return {
              ...course,
              prerequisites: course.prerequisites.filter(prereq => prereq !== prerequisiteIdToDelete)
            };
          }
          // otherwise, return the course unchanged
          return course;
        })
      );

      setAllCoursesBackUp(prevCourses =>
        prevCourses.map(course => {
          const currentCourseId = `${course.department}-${course.course_number}`;
          // find the parent course whose prerequisite was deleted
          if (currentCourseId === parentCourseIdOfDeletedPrereq) {
            // return a new course object with the prerequisite filtered out
            return {
              ...course,
              prerequisites: course.prerequisites.filter(prereq => prereq !== prerequisiteIdToDelete)
            };
          }
          // otherwise, return the course unchanged
          return course;
        })
      );

    } catch (error) {
      console.error("Error Deleting course prerequisite:", error);
      alert(`Error: ${error.message || 'Could not delete prerequisite.'}`);
    }

  };



  // handler for adding a course to a plan
  const handleAddCourseToPlan = async (course, planID, planLevel) => {
    // setIsLoadingForPage(true)
    let fixedPlanLevel = planLevel
    const course_ide = course.department + "-" + course.course_number
    console.log(`Adding ${course_ide} to plan ${planID} at level ${planLevel}`);
    if (planLevel.startsWith("Level")) {
      fixedPlanLevel = parseInt(planLevel.replace("Level", "").trim());
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/addCourseToPlanLevel`, {
        method: "POST",
        headers: {
          "Authorization": `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_name: planID, level_identifier: fixedPlanLevel, course_id: course_ide }),
      });
      const data = await response.json();
      if (data.frontEndMessage == 101) {
        setIsAddedNewCourse({ level: planLevel, course: course_ide, alreadyAdded: true })
      }
      else if (data.frontEndMessage == 102) {
        setIsAddedNewCourse({ level: planLevel, course: course_ide, moved: true, oldLevevl: data.old_level_key })
      }
      else {
        setIsAddedNewCourse({ level: planLevel, course: course_ide })
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

    } catch (error) {
      console.error("Error adding course to plan:", error);
      alert(`Failed to add course to plan: ${error.message}`);
    }
    finally {
      // setIsLoadingForPage(false)
    }
  };

  // handler for adding a prerequisite
  const handleAddingPrerequisite = async (newPrerequisiteCourse, parentCourseData) => {
    const parent_course_id = `${parentCourseData.department}-${parentCourseData.course_number}`;
    const prerequisite_course_id = `${newPrerequisiteCourse.department}-${newPrerequisiteCourse.course_number}`;

    // check if the prerequisite already exists locally 
    const parentCourseInState = allCourses.find(c =>
      `${c.department}-${c.course_number}` === parent_course_id
    );

    if (parentCourseInState && Array.isArray(parentCourseInState.prerequisites) && parentCourseInState.prerequisites.includes(prerequisite_course_id)) {
      alert(`${prerequisite_course_id} is already a prerequisite for ${parent_course_id}.`);
      setLocalParentCourse(null);
      return;
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/addCoursePre`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: parent_course_id, prerequisite: prerequisite_course_id }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(`Failed to add prerequisite. Conflict detected.`);
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      //Update UI Locally
      setAllCourses(prevCourses =>
        prevCourses.map(course => {
          const currentCourseId = `${course.department}-${course.course_number}`;
          if (currentCourseId === parent_course_id) {
            // ensure prerequisites array exists and is an array
            const existingPrerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : [];
            // return new course object with the new prerequisite added
            return {
              ...course,
              // add the new prerequisite to the existing list
              prerequisites: [...existingPrerequisites, prerequisite_course_id]
            };
          }
          return course;
        })
      );

    } catch (error) {
      console.error("Error adding prerequisite:", error);
      alert(`Error: ${error.message || 'Could not add prerequisite.'}`);

    }
    finally {
      setLocalParentCourse(null);
    }
  };

  // Dynamic header based on context
  let header;

  const searchBar = (<div className="mb-6 p-4 bg-gray-200 rounded-lg shadow">
    <input
      type="text"
      placeholder="Search by Course Code (e.g., CPIT-250)..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:primary-dark focus:border-transparent transition duration-150 ease-in-out"
    />
  </div>)

  if (localParentCourse) {
    header = (
      <>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Select prerequisite for <span className="font-bold text-primary-dark">{localParentCourse.department}{localParentCourse.course_number}</span>
        </h2>
        {searchBar}
      </>
    );
  } else if (planID) {
    header = (
      <>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Add course to <span className="font-bold text-primary-dark">{planID}</span> - <span className="font-bold text-secondary-dark">{planLevel}</span>
        </h2>
      {searchBar}
      </>
    );
  } else {
    header = (
      <>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Available Courses</h2>
        {searchBar}
      </>
    )
  }

  return (
    <div className="flex h-[70vh] w-[60vw] flex-col rounded-lg bg-white p-6 shadow-xl">
      {isCreatingCourse ? (
        <>
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Create New Course</h2>
          <form onSubmit={handleSaveNewCourse} className="flex-grow overflow-y-auto pr-2">
            <div className="mb-4">
              <label htmlFor="department" className="mb-1 block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Ex. CPIT"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="courseNumber" className="mb-1 block text-sm font-medium text-gray-700">Course Number</label>
              <input
                type="text"
                id="courseNumber"
                value={courseNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]*$/.test(value)) {
                    setCourseNumber(value);
                  }
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                inputMode="numeric"
                placeholder="Ex. 250"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="hours" className="mb-1 block text-sm font-medium text-gray-700">Hours</label>
              <input
                type="number"
                id="hours"
                value={hours}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || Number(value) >= 1) {
                    setHours(value);
                  }
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Ex. 3"
                min="1"
                max="15"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="courseName" className="mb-1 block text-sm font-medium text-gray-700">Course Name</label>
              <input
                type="text"
                id="courseName"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Ex. Software Engineering 1"
                required
              />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setIsCreatingCourse(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Save Course
              </button>
            </div>
          </form>
        </>
      ) : isLoading ? (
        <div className="flex flex-grow items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : (
        <>
          {header}
          <div className="flex-grow overflow-y-auto border-t border-b border-gray-200 py-2 pr-2">
            <ul className="space-y-3">
              {allCourses.map((course) => (
                <li
                  key={course.department + course.course_number}
                  className="rounded-md border border-gray-200 bg-white p-4"
                >
                  <h3 className="text-base font-semibold text-gray-900">
                    {course.course_id}: {course.course_name} ({course.hours} hours)
                  </h3>
                  {course.prerequisites && course.prerequisites.length > 0 ? (
                    <div className="mt-2">
                      <span className=" font-medium text-gray-500">Prerequisites:</span>
                      <ul className="ml-2 mt-1 space-y-1">
                        {course.prerequisites.map((prereq, index) => (
                          <li key={index} className="flex items-center justify-between rounded bg-gray-100 px-2 py-1">
                            <span className="text-sm text-gray-700">{prereq}</span>
                            <button onClick={() => {
                              setPrerequisitesCourseThatWantToBeDeleted(prereq)
                              setParentPrerequisitesCourseThatWantToBeDeleted(course.department + "-" + course.course_number)
                            }}
                              title={`Delete prerequisite ${prereq}`}
                              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full p-1.5 text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> {/* Adjusted strokeWidth */}
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-gray-500">No prerequisites</p>
                  )}
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {(planID && !localParentCourse) && (
                      <button
                        onClick={() => handleAddCourseToPlan(course, planID, planLevel)}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        Add to Plan
                      </button>
                    )}

                    {!localParentCourse && (
                      <>
                        <button
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                          onClick={() => setLocalParentCourse(course)}
                        >
                          Add Prerequisite
                        </button>
                        <button
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger-dark focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                          onClick={() => setCourseThatWantToBeDeleted(course)}
                        >
                          Delete Course
                        </button>
                      </>
                    )}

                    {localParentCourse && !(localParentCourse.department === course.department && localParentCourse.course_number === course.course_number) && (
                      <button
                        onClick={() => handleAddingPrerequisite(course, localParentCourse)}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        Add as Prerequisite
                      </button>
                    )}

                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-between">
            <button
              onClick={handleCreateNewCourse}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:w-auto"
            >
              Create New Course
            </button>
            {localParentCourse && <button //if there is set prerequist then show this button else hide it
              onClick={() => {
                setLocalParentCourse(null)
              }}
              className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 sm:w-auto sm:order-first"
            >
              Cancel Prerequisite Selection
            </button>}
          </div>
        </>
      )}
    </div>
  );
};

export default ShowCoursesPopUp;