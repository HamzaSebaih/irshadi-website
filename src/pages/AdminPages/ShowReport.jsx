import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

// Define the ShowReport component
const ShowReport = () => {
    // Get location state and navigation function from react-router-dom
    const location = useLocation();
    const navigate = useNavigate();

    // State for storing the report data received from location state
    const [reportJson, setReportJson] = useState(null);
    // State for storing the type of report to display
    const [typeOfReport, setTypeOfReport] = useState(null);
    // State to manage loading status
    const [isLoading, setIsLoading] = useState(true);
    // State to store the search term for report type 1
    const [searchTerm1, setSearchTerm1] = useState("");
    // State to store the search term for report type 2
    const [searchTerm2, setSearchTerm2] = useState("");
    // State to store the search term for report type 3
    const [searchTerm3, setSearchTerm3] = useState("");
    // State to store the search term for report type 4 (NEW)
    const [searchTerm4, setSearchTerm4] = useState("");


    // Effect hook to process data passed via location state when component mounts or location state changes
    useEffect(() => {
        // Check if essential data (reportJson and typeOfReport) is present in location state
        if (location.state?.reportJson && location.state?.typeOfReport !== undefined) {
            // Set the state with the received data
            setReportJson(location.state.reportJson);
            setTypeOfReport(location.state.typeOfReport);
            // Mark loading as complete
            setIsLoading(false);
        } else {
            // Log a warning and redirect if data is missing
            console.warn("Report data or type missing in location state, redirecting...");
            navigate("/AdminHomePage"); // Redirect to the admin home page
        }
        // Dependencies: re-run effect if location.state or navigate changes
    }, [location.state, navigate]);

    // --- Helper function to handle search input changes for section 1 ---
    const handleSearchChange1 = (event) => {
        setSearchTerm1(event.target.value); // Update search term state for section 1
    };

    // --- Helper function to handle search input changes for section 2 ---
    const handleSearchChange2 = (event) => {
        setSearchTerm2(event.target.value); // Update search term state for section 2
    };

    // --- Helper function to handle search input changes for section 3 ---
    const handleSearchChange3 = (event) => {
        setSearchTerm3(event.target.value); // Update search term state for section 3
    };

    // --- Helper function to handle search input changes for section 4 --- (NEW)
    const handleSearchChange4 = (event) => {
        setSearchTerm4(event.target.value); // Update search term state for section 4
    };


    // Display a loading message while data is being fetched or processed
    if (isLoading) {
        return (
            <div className="p-6 text-center bg-primary-dark text-white">
                Loading report data...
            </div>
        );
    }

    // ---- Report Type 1: All Course Priority Lists ----
    if (typeOfReport === 1) {
        // Safely access course priority lists, defaulting to an empty object if null/undefined
        const coursePriorityLists = reportJson?.course_priority_lists ?? {};

        // Filter courses based on the search term (case-insensitive) for section 1
        const filteredCourses = Object.entries(coursePriorityLists).filter(
            ([courseCode]) => courseCode.toLowerCase().includes(searchTerm1.toLowerCase())
        );

        // Display a message if no data is available after initial load
        if (!coursePriorityLists || Object.keys(coursePriorityLists).length === 0) {
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white ">No course priority data available.</p>
                    </div>
                </div>
            );
        }

        // Render the report for type 1
        return (
            <div className="space-y-6 p-4">
                {/* Report Title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-white">
                    Course Priority Lists Report
                </h1>

                {/* Search Bar Container for Section 1 */}
                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow"> {/* Container with dark background */}
                    <input
                        type="text"
                        placeholder="Search by Course Code (e.g., CPIT-250)..."
                        value={searchTerm1} // Use state for section 1
                        onChange={handleSearchChange1} // Use handler for section 1
                        // Styling for the input itself (contrasting against the dark container)
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>

                {/* Display filtered courses or a "no results" message */}
                {filteredCourses.length > 0 ? (
                    // Iterate over each filtered course
                    filteredCourses.map(([courseCode, students]) => (
                        // Card container for each course
                        <div key={courseCode} className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                            {/* Card Header */}
                            <div className="p-4 bg-primary-dark">
                                <h2 className="text-lg font-medium text-white">Course: {courseCode}</h2>
                            </div>
                            {/* Card Content */}
                            <div className="p-4">
                                {/* Check if there are students for the course */}
                                {students && students.length > 0 ? (
                                    // Table container for responsiveness
                                    <div className="overflow-x-auto">
                                        {/* Student Table */}
                                        <table className="min-w-full divide-y divide-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.2)]">
                                            {/* Table Header */}
                                            <thead className="bg-primary-light">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Name</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">University ID</th>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Email</th>
                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r">GPA</th>
                                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Graduating</th>
                                                </tr>
                                            </thead>
                                            {/* Table Body */}
                                            <tbody className="bg-gray-300 divide-y">
                                                {/* Iterate over students */}
                                                {students.map((student, index) => (
                                                    <tr className="hover:bg-accent-light" key={`${courseCode}-student-${index}`}>
                                                        {/* Student details with nullish coalescing for safety */}
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r">{student?.name ?? 'N/A'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm border-r">{student?.university_student_id ?? 'N/A'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm border-r">{student?.email ?? 'N/A'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right border-r">{student?.gpa?.toFixed(2) ?? 'N/A'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">{student?.is_graduating ? 'Yes' : 'No'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    // Message if no students found for this course
                                    <p className="p-4 text-center text-gray-600">No students found for this course.</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    // Message if search yields no results
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No courses found matching "{searchTerm1}".
                    </div>
                )}
            </div>
        );
    }

    // ---- Report Type 2: Form Course Statistics ----
    if (typeOfReport === 2) {
        // Safely access course stats
        const courseStats = reportJson?.course_stats ?? {};

        // Filter course stats based on the search term (case-insensitive) for section 2
        const filteredCourseStats = Object.entries(courseStats).filter(
            ([courseCode]) => courseCode.toLowerCase().includes(searchTerm2.toLowerCase())
        );


        // Display message if no stats data available
        if (!courseStats || Object.keys(courseStats).length === 0) {
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white">No course statistics available.</p>
                    </div>
                </div>
            );
        }

        // Render the report for type 2
        return (
            <div className="p-4">
                {/* Report Title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-white">
                    Course Statistics Report
                </h1>

                {/* Search Bar Container for Section 2 */}
                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow"> {/* Container with dark background */}
                    <input
                        type="text"
                        placeholder="Search by Course Code (e.g., CPIT-250)..."
                        value={searchTerm2} // Use state for section 2
                        onChange={handleSearchChange2} // Use handler for section 2
                        // Styling for the input itself (contrasting against the dark container)
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>

                {/* Card container - Only render if there are results */}
                {filteredCourseStats.length > 0 ? (
                    <div className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                        {/* Card Header */}
                        <div className="p-4 bg-primary-dark">
                            <h2 className="text-lg font-medium text-white">
                                Statistics Summary
                            </h2>
                        </div>
                        {/* Card Content */}
                        <div className="p-4">
                            {/* Table container */}
                            <div className="overflow-x-auto">
                                {/* Course Statistics Table */}
                                <table className="min-w-full divide-y divide-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.2)]">
                                    {/* Table Header */}
                                    <thead className="bg-primary-light">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Course Code</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Title</th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r">Hours</th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r">Total Selected</th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r">Graduating Selected</th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Undergrad Selected</th>
                                        </tr>
                                    </thead>
                                    {/* Table Body */}
                                    <tbody className="bg-gray-300 divide-y">
                                        {/* Iterate over FILTERED course stats */}
                                        {filteredCourseStats.map(([courseCode, stats]) => (
                                            <tr key={courseCode} className="hover:bg-accent-light">
                                                {/* Course stat details */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r">{courseCode}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm border-r">{stats?.details?.title ?? 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right border-r">{stats?.details?.hours ?? 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right border-r">{stats?.total_selected ?? 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right border-r">{stats?.graduating_selected ?? 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{stats?.undergraduate_selected ?? 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Message if search yields no results for section 2
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No course statistics found matching "{searchTerm2}".
                    </div>
                )}
            </div>
        );
    }

    // ---- Report Type 3: Graduating Student Courses ----
    if (typeOfReport === 3) {
        // Safely access graduating students list
        const graduatingStudents = reportJson?.graduating_students ?? [];

        // Filter students based on the search term (University ID)
        const filteredGraduatingStudents = graduatingStudents.filter(student =>
            student?.university_student_id?.toLowerCase().includes(searchTerm3.toLowerCase())
        );


        // Display message if no graduating student data available initially
        if (!graduatingStudents || graduatingStudents.length === 0) {
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white">No graduating student data available.</p>
                    </div>
                </div>
            );
        }

        // Render the report for type 3
        return (
            <div className="p-4">
                {/* Report Title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-white">
                    Graduating Students Report
                </h1>

                {/* Search Bar Container for Section 3 */}
                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow">
                    <input
                        type="text"
                        placeholder="Search by University ID..."
                        value={searchTerm3}
                        onChange={handleSearchChange3}
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>

                {/* Card container - Only render if there are results */}
                 {filteredGraduatingStudents.length > 0 ? (
                    <div className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                        {/* Card Header */}
                        <div className="p-4 bg-primary-dark">
                            <h2 className="text-lg font-medium text-white">
                                Student Details
                            </h2>
                        </div>
                        {/* Card Content */}
                        <div className="p-4">
                            {/* Table container */}
                            <div className="overflow-x-auto">
                                {/* Graduating Students Table */}
                                <table className="min-w-full divide-y divide-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.2)]">
                                    {/* Table Header */}
                                    <thead className="bg-primary-light">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Name</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">University ID</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Email</th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">GPA</th>
                                        </tr>
                                    </thead>
                                    {/* Table Body */}
                                    <tbody className="bg-gray-300 divide-y">
                                        {/* Iterate over FILTERED graduating students */}
                                        {filteredGraduatingStudents.map((student, index) => (
                                            <tr className="hover:bg-accent-light" key={`grad-student-${index}`}>
                                                {/* Student details */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r">{student?.name ?? 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm border-r">{student?.university_student_id ?? 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm border-r">{student?.email ?? 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">{student?.gpa?.toFixed(2) ?? 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                 ) : (
                    // Message if search yields no results for section 3
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No graduating students found matching "{searchTerm3}".
                    </div>
                 )}
            </div>
        );
    }

    // ---- Report Type 4: Generate Section Schedule ---- (MODIFIED SECTION)
    if (typeOfReport === 4) {
        // Safely access section assignments, defaulting to an empty object
        const sectionAssignments = reportJson?.section_assignments ?? {};
        // Safely access schedule preference
        const schedulePreference = reportJson?.schedule_preference ?? 'Not specified';

        // Filter section assignments based on the search term (course code) (NEW)
        const filteredAssignments = Object.entries(sectionAssignments).filter(
            ([courseCode]) => courseCode.toLowerCase().includes(searchTerm4.toLowerCase())
        );

        // Display message if no section assignment data available initially
        if (!sectionAssignments || Object.keys(sectionAssignments).length === 0) {
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white">No section schedule data available.</p>
                    </div>
                </div>
            );
        }

        // Render the report for type 4
        return (
            <div className="space-y-6 p-4">
                {/* Report Title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-white">
                    Generated Section Schedule Report
                </h1>

                {/* Display Schedule Preference */}
                 <div className="p-4 bg-gray-200 rounded-lg shadow mb-6">
                    <p className="text-center text-gray-800">
                        <span className="font-semibold">Schedule Preference:</span> {schedulePreference.replace(/([A-Z])/g, ' $1').trim()} {/* Add space before capitals */}
                    </p>
                </div>


                {/* Search Bar Container for Section 4 (NEW) */}
                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow">
                    <input
                        type="text"
                        placeholder="Search by Course Code (e.g., CPIS-334)..."
                        value={searchTerm4}
                        onChange={handleSearchChange4}
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>

                {/* Display filtered assignments or a "no results" message */}
                {filteredAssignments.length > 0 ? (
                    // Iterate over each filtered course assignment
                    filteredAssignments.map(([courseCode, sections]) => (
                        // Card container for each course
                        <div key={courseCode} className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                            {/* Card Header */}
                            <div className="p-4 bg-primary-dark">
                                <h2 className="text-lg font-medium text-white">Course: {courseCode}</h2>
                            </div>
                            {/* Card Content */}
                            <div className="p-4 space-y-4"> {/* Add space between sections */}
                                {/* Check if there are sections for the course */}
                                {sections && sections.length > 0 ? (
                                    sections.map((section, sectionIndex) => (
                                        // Sub-card or container for each section
                                        <div key={`${courseCode}-section-${sectionIndex}`} className="border border-gray-300 rounded-md bg-gray-50 p-3">
                                            <h3 className="text-md font-semibold text-primary-dark mb-2">{section.section_name ?? 'Unnamed Section'}</h3>
                                            {/* Check if there are slots for the section */}
                                            {section.slots && section.slots.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {/* Iterate over slots */}
                                                    {section.slots.map((slot, slotIndex) => (
                                                        <li key={`${courseCode}-section-${sectionIndex}-slot-${slotIndex}`}>
                                                            <span className="font-medium">{slot.day ?? 'N/A'}</span>: {slot.start ?? 'N/A'} - {slot.end ?? 'N/A'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No time slots assigned.</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Message if no sections found for this course
                                    <p className="p-4 text-center text-gray-600">No sections found for this course.</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    // Message if search yields no results for section 4 (NEW)
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No sections found matching "{searchTerm4}".
                    </div>
                )}
            </div>
        );
    }


    // ---- Default: Invalid Report Type or No Data ----
    // Render an error message if the report type is invalid or data failed to load
    return (
        <div className="border border-danger rounded-lg shadow-sm bg-danger-light">
            <div className="p-6">
                <p className="text-center text-danger-dark font-medium">
                    Invalid report type ({typeOfReport === null ? 'Not loaded' : typeOfReport}) or failed to load data.
                </p>
            </div>
        </div>
    );
};

// Export the component for use in other parts of the application
export default ShowReport;
