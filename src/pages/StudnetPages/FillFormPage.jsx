import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Assuming this path is correct
import CourseSection from "../../components/CourseSection";


const FillFormPage = () => {
    const backendIp = "http://127.0.0.1:5000"; // Backend IP domain
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth(); // Get current user from AuthContext
    const [isLoading, setIsLoading] = useState(true); // Start loading initially
    const [coursesObj, setCoursesObj] = useState(null); // Initialize with null
    const [selectedCourses, setSelectedCourses] = useState([]); // Store IDs of selected courses
    const [searchQuery, setSearchQuery] = useState(''); // State for search input
    const [needUpdate,setNeedUpdate]= useState(false)

    useEffect(() => {
        // Redirect if form data is missing in location state
        if (!location?.state?.form) {
            console.warn("Form data missing, redirecting...");
            navigate("/AvailableForms"); // Redirect to form selection
            return; // Stop execution if redirecting
        }

        const fetchCourses = async () => {
            setIsLoading(true);
            if (!user) {
                console.error("User not authenticated.");
                setIsLoading(false);
                // Handle not authenticated state, maybe redirect to login
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
                    body: JSON.stringify({ form_id: location.state.form.form_id }),
                });

                if (!response.ok) {
                    if(response.status===403){
                        setNeedUpdate(true)
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    else{
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }
                
                const data = await response.json();
                // Use the example structure if fetch fails or for testing
                /* const data = {
                         "available_courses": ["CPIT-499", "CPIT-550", "CPIT-503", "CPIT-502", "CPIT-332", "CPIT-504", "CPIS-334", "CPIT-500"],
                         "form_id": "2",
                         "max_graduate_hours": 21, // Assuming this comes from API
                         "plan_id": "IT",
                         "previously_selected_courses": [], // Assuming this comes from API
                         "recommended_courses": ["CPIT-332"],
                         "unavailable_due_to_completion": [], // Assuming this comes from API
                         "unavailable_due_to_prerequisites": [{"course_id": "CPIT-501", "missing": ["CPIT-332"]}]
                     }; */
                setCoursesObj(data);
                // Initialize selected courses based on previously selected ones if needed
                setSelectedCourses(data.previously_selected_courses || []);
                setNeedUpdate(false)
            } catch (error) {
                console.error("Error fetching plan details:", error);
                // Handle fetch error (e.g., show error message)
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();

    }, [location, navigate, user]); // Dependencies for the effect

    const handleSubmit = () => {
        sendSubmit().finally(() => {
            // Display success message
            alert('Form submitted successfully!'); // Simple success alert

            console.log("Form submitted successfully. Navigating..."); // Optional: log success

            // Navigate the user after successful submission and showing the message
            navigate('/AvailableForms'); // Navigate back to AvailableForms page
        })
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

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

        } catch (error) {
            console.error("Error adding form:", error);
            alert(`Failed to add form: ${error.message}`);
        }
    };




    // --- Handle Checkbox Changes ---
    const handleCheckboxChange = (courseId) => {
        setSelectedCourses(prevSelected =>
            prevSelected.includes(courseId)
                ? prevSelected.filter(id => id !== courseId) // Uncheck: remove course
                : [...prevSelected, courseId] // Check: add course
        );
    };

    // --- Filtering Logic ---
    const filteredCourses = useMemo(() => {
        if (!coursesObj) return { available: [], unavailable: [], recommended: [] };

        const lowerCaseQuery = searchQuery.toLowerCase();

        const filterById = (courseId) => courseId.toLowerCase().includes(lowerCaseQuery);

        // Filter available courses, excluding recommended ones initially
        const available = coursesObj.available_courses
            .filter(id => !coursesObj.recommended_courses.includes(id))
            .filter(filterById);

        // Filter recommended courses
        const recommended = coursesObj.recommended_courses.filter(filterById);

        // Prepare unavailable courses with reasons
        const unavailable = [
            ...coursesObj.unavailable_due_to_completion.map(id => ({ id, reason: "Completed" })),
            ...coursesObj.unavailable_due_to_prerequisites.map(c => ({ id: c.course_id, reason: `Missing: ${c.missing.join(', ')}` }))
        ].filter(course => filterById(course.id));


        return { available, unavailable, recommended };

    }, [coursesObj, searchQuery]); // Recalculate when courses or search query changes

    // --- Calculate Current Workload ---
    // Use reduce to sum up hours from the coursesObj based on selectedCourses
    const currentWorkload = selectedCourses.reduce((totalHours, courseId) => {
        // Get the hours for the current courseId from the map
        const hours = coursesObj?.available_course_hours?.[courseId] ?? 0;
        return totalHours + hours;
    }, 0); // Start the sum at 0

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                {/* Enhanced Loading Spinner using Tailwind colors */}
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-light border-t-primary-dark"></div>
            </div>
        );
    }

    // --- Error State (if coursesObj is null after loading) ---
    if (!coursesObj && needUpdate) {
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

    if (!coursesObj) {
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

    // --- Main Component Return ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                {/* Page Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-6 border-b pb-3">
                    Course Selection - {coursesObj.plan_id}
                </h1>

                {/* Workload Indicator */}
                <div className="mb-6 p-4 border border-accent-light rounded-lg bg-blue-50">
                    <h2 className="text-lg font-semibold text-accent-dark mb-2">Workload</h2>
                    <p className="text-gray-700 mb-2">
                        Selected Hours: <span className="font-bold">{currentWorkload}</span> / {coursesObj.max_graduate_hours || 'N/A'} Max Hours
                    </p>
                    {/* Simple Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-300 ease-out ${currentWorkload > coursesObj.max_graduate_hours ? 'bg-danger-dark' : 'bg-primary-light'}`} // Change color if over limit
                            style={{ width: `${coursesObj.max_graduate_hours ? Math.min((currentWorkload / coursesObj.max_graduate_hours) * 100, 100) : 0}%` }} // Cap width at 100%
                        >
                        </div>
                    </div>
                    {currentWorkload > coursesObj.max_graduate_hours && (
                        <p className="text-sm text-warning-dark mt-2">Warning: Exceeding maximum allowed hours!</p>
                    )}
                </div>


                {/* Search Input */}
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
                    <CourseSection
                        title="Recommended Courses"
                        courses={filteredCourses.recommended}
                        isRecommended={true}
                        selectedCourses={selectedCourses}
                        handleCheckboxChange={handleCheckboxChange}
                    />
                    <CourseSection
                        title="Available Courses"
                        courses={filteredCourses.available}
                        selectedCourses={selectedCourses}
                        handleCheckboxChange={handleCheckboxChange}
                    />
                    <CourseSection
                        title="Unavailable Courses"
                        courses={filteredCourses.unavailable}
                        isUnavailable={true}
                        selectedCourses={selectedCourses} // Pass for consistency, though checkboxes are disabled
                        handleCheckboxChange={handleCheckboxChange} // Pass for consistency
                    />
                </div>

                {/* No Courses Found Message */}
                {filteredCourses.available.length === 0 &&
                    filteredCourses.unavailable.length === 0 &&
                    filteredCourses.recommended.length === 0 &&
                    searchQuery && (
                        <div className="text-center py-4 text-gray-500">
                            No courses found matching "{searchQuery}".
                        </div>
                    )}


                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={selectedCourses.length === 0 || currentWorkload > coursesObj.max_graduate_hours} // Disable if no courses or over limit
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