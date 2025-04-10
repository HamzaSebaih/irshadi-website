import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const ShowCoursesPopUp = ({ parentCourse, planID, planLevel }) => {
  const backendIp = "http://127.0.0.1:5000"; // Backend IP domain
  const [allCourses, setAllCourses] = useState([]); // State for the list of courses
  const [isCreatingCourse, setIsCreatingCourse] = useState(false); // Toggle form visibility
  const [department, setDepartment] = useState(""); // Form field: department (String)
  const [courseNumber, setCourseNumber] = useState(""); // Form field: course_number (int)
  const [courseName, setCourseName] = useState(""); // Form field: course_name (String)
  const [hours, setHours] = useState(""); // Form field: hours (int)
  const [updateTheTable,setUpdateTheTable]=useState(false)
  const { user } = useAuth(); // Get current user from AuthContext
  const token = user?.accessToken; // Access token for backend requests

  // Fetch courses when the component mounts
  useEffect(() => {
    if (!user) return; // Exit if no user is authenticated
    fetchCourses();
    setUpdateTheTable(false)
  }, [updateTheTable]); // Empty dependency array to run only on mount

  // Function to fetch courses from the backend
  const fetchCourses = async () => {
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
    e.preventDefault(); // Prevent default form submission
    const newCourse = {
      department,
      course_number: parseInt(courseNumber), // Convert to integer
      course_name: courseName,
      hours: parseInt(hours), // Convert to integer
    };
    try {
      const response = await fetch(`${backendIp}/addCourse`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCourse),
      })
      setUpdateTheTable(true)
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const createdCourse = await response.json(); // Get the newly created course
      setAllCourses([...allCourses, createdCourse]); // Add to course list
      setIsCreatingCourse(false); // Hide the form
      // Reset form fields
      setDepartment("");
      setCourseNumber("");
      setCourseName("");
      setHours("");
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course. Please try again."); // Basic error feedback
    }
  };

  // Placeholder handler for adding a course to a plan TODO
  const handleAddCourseToPlan = (course, planID, planLevel) => {
    console.log(`Adding ${course.department+course.course_number} to plan ${planID} at level ${planLevel}`);
  };

  // Placeholder handler for adding a prerequisite TODO
  const handleAddingPrerequisite = (course, parentCourse) => {
    console.log(`Adding ${course.department+course.course_number} as prerequisite to ${parentCourse.department+parentCourse.course_number}`);
  };

  // Dynamic header based on context
  let header;
  if (parentCourse) {
    header = (
      <h2 className="text-xl font-semibold mb-4">
        Select a course to add as prerequisite to {parentCourse.courseCode}
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
    <div className="p-6 bg-white rounded shadow-md">
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
                  if (/^[0-9]*$/.test(value)) { //here I used regEx to prevent the user from entering non numbers 
                    setCourseNumber(value); //I could have used input type numbers but I didn't like the way the browser handle it
                  } // / stand for the start of the reg ^ stand for the start of the string ensure the reg start from the begining
                }} //form 0-9 then the * is like telling the reg its ok if it was longer than 1 and lastly $ apply for the whole input 
                className="w-full p-2 border border-gray-300 rounded"
                inputMode="numeric" //for phone users
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
                  // Only update hours if the value is empty (to allow clearing) or non-negative
                  if (value === "" || Number(value) >= 1) {
                    setHours(value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Ex. 3"
                min="1" // Prevents negative numbers via browser UI
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
      ) : (
        <>
          {header}
          <ul className="space-y-2">
            {allCourses.map((course) => (
              
              <li
                key={course.department+course.course_number}
                className="flex items-center justify-between p-3 border border-gray-200 rounded"
              >
                <span className="font-medium">{course.department+course.course_number}</span>
                <div className="space-x-2">
                  {parentCourse && ( //if parentCourse isn't null load this info 
                    <button
                      onClick={() => handleAddingPrerequisite(course, parentCourse)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
                    >
                      Add as Prerequisite
                    </button>
                  )}
                  {planID && (
                    <button
                      onClick={() => handleAddCourseToPlan(course, planID, planLevel)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                    >
                      Add to Plan
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={handleCreateNewCourse}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded"
          >
            Create New Course
          </button>
        </>
      )}
    </div>
  );
};

export default ShowCoursesPopUp;