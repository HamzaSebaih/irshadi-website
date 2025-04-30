import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import CourseSection from "../../components/CourseSection"; //here I used component because I need to repeat it 3 times


const FillFormPage = () => {
    const backendIp = "http://127.0.0.1:5000"; // Backend IP
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth(); // get current user from AuthContext
    const [isLoading, setIsLoading] = useState(true); // Start loading
    const [coursesObj, setCoursesObj] = useState(null);
    const [selectedCourses, setSelectedCourses] = useState([]); // Store IDs of selected courses
    const [searchQuery, setSearchQuery] = useState(''); // State for search input
    const [needUpdate, setNeedUpdate] = useState(false)

    useEffect(() => {
        // here we redirect if form data is missing in location state
        if (!location?.state?.form) {
            console.warn("Form data missing, redirecting...");
            navigate("/AvailableForms"); // redirect to form selection
            return;
        }

        const fetchCourses = async () => { //we get the courses if the form from this fetch
            setIsLoading(true);
            if (!user) {
                console.error("User not authenticated.");
                setIsLoading(false);
                return;
            }

            try {
                const token = await user.getIdToken();
                const response = await fetch(`${backendIp}/getFormCourses`, {
                    method: "POST",
                    headers: {
                        "Authorization": `${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ form_id: location.state.form.form_id }), //here we are sending the form id from the data we get in the previos page
                });

                if (!response.ok) {
                    if (response.status === 403) { //here when the backend send error 403 thats means the user need to update its acadmic records before starting the form
                        setNeedUpdate(true) //we update this vaule for better UX to send a clear message in the return
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    else {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }

                const data = await response.json();
                setCoursesObj(data);
                setSelectedCourses(data.previously_selected_courses || []);
                setNeedUpdate(false)
            } catch (error) {
                console.error("Error fetching plan details:", error);
            } finally {
                setIsLoading(false); //end the loading 
            }
        };

        fetchCourses();

    }, [location, navigate, user]);

    const handleSubmit = () => {
        sendSubmit()
    }

    const sendSubmit = async () => {
        try {
            const token = await user.getIdToken();
            const body = {
                form_id: location.state.form.form_id,
                selected_courses: selectedCourses,
            };
            const response = await fetch(`${backendIp}/addFormResponse`, {
                method: "POST",
                headers: {
                    Authorization: `${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...body }),
            });

            // display success message
            alert('Form submitted successfully!'); //success alert

            // navigate the user after successful submission
            navigate('/AvailableForms'); // navigate back to AvailableForms page

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

        } catch (error) {
            console.error("Error adding form:", error);
            alert(`Failed to add form: ${error.message}`);
        }
    };




    // this function will handle the adding or the deletion for the selected course
    const handleCheckboxChange = (courseId) => {
        setSelectedCourses(prevSelected => // prevSelected automatically receives the current value of the selectedCourses state array
            prevSelected.includes(courseId) // we check if the courseId from the clicked checkbox is already in the array of selected courses
                ? prevSelected.filter(id => id !== courseId)  //if true then create a new array with .filter with a condtion that will remove the selected course 
                : [...prevSelected, courseId] // else unpack the prevSelected and append it with the new course
        ); //in short this function work like a toggle
    };

    // this is the filtering logic where I return 3 arrays available, unavailable, and recommended
    // this is useful when I implment the search later
    const filteredCourses = useMemo(() => { //useMemo to make the peformance better insted of createing a new instance if nothing change don't create a new one
        if (!coursesObj) return { available: [], unavailable: [], recommended: [] };

        const lowerCaseQuery = searchQuery.toLowerCase(); //searchQuery is the user input so here I put it in lower case 

        const filterById = (courseId) => courseId.toLowerCase().includes(lowerCaseQuery); //make the courseID to lowerCase because I will use it a lot  

        // here I get all the availabe courses based on the search but get rid of the recommended one
        const available = coursesObj.available_courses
            .filter(id => !coursesObj.recommended_courses.includes(id))
            .filter(filterById);

        // same for recommended courses but no need to get rid of anything
        const recommended = coursesObj.recommended_courses.filter(filterById);

        // also I did it for the unavailable courses but I need to consider the reasons
        const unavailable = [
            // courses unavailable due to completion
            ...coursesObj.unavailable_due_to_completion.map(id => ({ id, reason: "Completed" })),

            // courses unavailable due to missing prerequisites
            ...coursesObj.unavailable_due_to_prerequisites.map(c => ({ id: c.course_id, reason: `Missing: ${c.missing.join(', ')}` }))

            // combine the results into one array
        ].filter(course => filterById(course.id)); // lastly I search in the combined array wuth the course I want 


        return { available, unavailable, recommended };

    }, [coursesObj, searchQuery]); // recalculate when courses or search query changes (useMemo)

    // Workload bar
    // here I used reduce to sum up hours from the coursesObj based on selectedCourses
    const currentWorkload = selectedCourses.reduce((totalHours, courseId) => {
        // get the hours for the current course
        const hours = coursesObj?.available_course_hours?.[courseId] ?? 0; //if no hours avaliable it will be 0 
        return totalHours + hours;
    }, 0); // start the sum at 0

    // loading State
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-light border-t-primary-dark"></div>
            </div>
        );
    }

    // error State if coursesObj is null
    if (!coursesObj && needUpdate) { // needUpdate is a value will be true only if there is error code 403
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <div className="text-center p-6 bg-white rounded-lg shadow-md border border-danger-light">
                    <h2 className="text-xl font-semibold text-danger-dark mb-2">Error Loading Form</h2>
                    <p className="text-gray-600">Please Update your Academic records first</p>
                    <button
                        onClick={() => navigate("/StudentImportRecordPage")}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2"
                    >
                        Import Academic Records
                    </button>
                </div>
            </div>
        );
    }

    if (!coursesObj) { // normal error state
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <div className="text-center p-6 bg-white rounded-lg shadow-md border border-danger-light">
                    <h2 className="text-xl font-semibold text-danger-dark mb-2">Error Loading Courses</h2>
                    <p className="text-gray-600">Could not load course data. Please try again later or contact support.</p>
                    <button
                        onClick={() => navigate("/AvailableForms")}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // main component
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                {/* title */}
                <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-6 border-b pb-3">
                    Course Selection - {coursesObj.plan_id}
                </h1>

                {/* workload */}
                <div className="mb-6 p-4 border border-accent-light rounded-lg bg-blue-50">
                    <h2 className="text-lg font-semibold text-accent-dark mb-2">Workload</h2>
                    <p className="text-gray-700 mb-2">
                        Selected Hours: <span className="font-bold">{currentWorkload}</span> / {coursesObj.max_graduate_hours || 'N/A'} Max Hours
                    </p>
                    {/* progress Bar in the workload */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-300 ease-out ${currentWorkload > coursesObj.max_graduate_hours ? 'bg-danger-dark' : 'bg-primary-light'}`} // Change color if over limit
                            style={{ width: `${coursesObj.max_graduate_hours ? Math.min((currentWorkload / coursesObj.max_graduate_hours) * 100, 100) : 0}%` }} // cap width at 100% using Math.min
                        >
                        </div>
                    </div>
                    {currentWorkload > coursesObj.max_graduate_hours && (
                        <p className="text-sm text-warning-dark mt-2">Warning: Exceeding maximum allowed hours!</p>
                    )}
                </div>


                {/* search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search courses by ID (e.g., CPIT-250)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary-light shadow-sm"
                    />
                </div>

                <div className="space-y-4">
                    <CourseSection //here I used component because I need to repeat it 3 times
                        title="Recommended Courses"
                        courses={filteredCourses.recommended}
                        isRecommended={true}
                        selectedCourses={selectedCourses}
                        handleCheckboxChange={handleCheckboxChange}
                    />
                    <CourseSection //here I used component because I need to repeat it 3 times
                        title="Available Courses"
                        courses={filteredCourses.available}
                        selectedCourses={selectedCourses}
                        handleCheckboxChange={handleCheckboxChange}
                    />
                    <CourseSection //here I used component because I need to repeat it 3 times
                        title="Unavailable Courses"
                        courses={filteredCourses.unavailable}
                        isUnavailable={true}
                        selectedCourses={selectedCourses} // Pass for consistency, though checkboxes are disabled
                        handleCheckboxChange={handleCheckboxChange} // Pass for consistency
                    />
                </div>

                {/* no courses found */}
                {filteredCourses.available.length === 0 &&
                    filteredCourses.unavailable.length === 0 &&
                    filteredCourses.recommended.length === 0 &&
                    searchQuery && (
                        <div className="text-center py-4 text-gray-500">
                            No courses found matching "{searchQuery}".
                        </div>
                    )}


                {/* submit button */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={selectedCourses.length === 0 || currentWorkload > coursesObj.max_graduate_hours} // disable if no courses or over limit
                        className="px-6 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Selection
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FillFormPage;