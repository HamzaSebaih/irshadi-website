import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router';


const ShowReport = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportJson, setReportJson] = useState(null);
    const [typeOfReport, setTypeOfReport] = useState(null);
    const [searchTerm1, setSearchTerm1] = useState("");
    const [searchTerm2, setSearchTerm2] = useState("");
    const [searchTerm3, setSearchTerm3] = useState("");
    const [searchTerm4, setSearchTerm4] = useState("");

 // in this page I will check for each report type then generate context based on it's type 
 // we have 4 types in total so we could use switch or if statment
 // we used if statment because I think switch code is a little bit ugly to see
    useEffect(() => {
        // check for essential data in location.state
        if (location.state?.reportJson && location.state?.typeOfReport !== undefined) {
            setReportJson(location.state.reportJson); //set the data from location.state
            setTypeOfReport(location.state.typeOfReport); //set the data from location.stat
        } else {
            // redirect if data is missing
            console.warn("Report data or type missing in location state, redirecting...");
            navigate("/AdminHomePage"); // redirect to the admin home page
        }
    }, [location.state, navigate]);

    // handle search input changes for section 1 
    const handleSearchChange1 = (event) => {
        setSearchTerm1(event.target.value);
    };

    // handle search input changes for section 2
    const handleSearchChange2 = (event) => {
        setSearchTerm2(event.target.value); 
    };

    // handle search input changes for section 3 
    const handleSearchChange3 = (event) => {
        setSearchTerm3(event.target.value); 
    };

    // handle search input changes for section 4
    const handleSearchChange4 = (event) => {
        setSearchTerm4(event.target.value); 
    };

 

    // Report type 1: All Course Priority Lists -----------------------------
    if (typeOfReport === 1) {
        const coursePriorityLists = reportJson?.course_priority_lists ?? {}; //get the priorty list from the state

        const filteredCourses = Object.entries(coursePriorityLists).filter( //this for the search bar
            ([courseCode]) => courseCode.toLowerCase().includes(searchTerm1.toLowerCase())
        );

        // before doing anything we need to check if there is a data or not (maybe no student fill out the form yet)
        if (!coursePriorityLists || Object.keys(coursePriorityLists).length === 0) {
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white ">No course priority data available.</p>
                    </div>
                </div>
            );
        }

       //else (there is data) then we are ready to show it
        return (
            <div className="space-y-6 p-4">
                {/* title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-primary-dark">
                    Course Priority Lists Report
                </h1>

                {/* search bar */}
                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow"> 
                    <input
                        type="text"
                        placeholder="Search by Course Code (e.g., CPIT-250)..."
                        value={searchTerm1} 
                        onChange={handleSearchChange1} 
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>

                {filteredCourses.length > 0 ? ( //check if there is a result from the search or not
                    filteredCourses.map(([courseCode, students]) => (
                        <div key={courseCode} className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                            {/* header */}
                            <div className="p-4 bg-primary-dark">
                                <h2 className="text-lg font-medium text-white">Course: {courseCode}</h2>
                            </div>
                            <div className="p-4">
                                {students && students.length > 0 ? ( //check if there is a 1 student at least registed this course
                                //Note: the back-end should send only the courses that has been registed by students but it won't hurt checking twice
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y border">
                                            <thead className="bg-primary-light">
                                                <tr>
                                                    <th scope="col" className="w-3/12 px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Name</th>    
                                                    <th scope="col" className="w-3/12 px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">University ID</th>  
                                                    <th scope="col" className="w-3/12 px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Email</th>        
                                                    <th scope="col" className="w-1/12 px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r">GPA</th>          
                                                    <th scope="col" className="w-1/12 px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Graduating</th>  
                                                </tr>
                                            </thead>
                                            {/* table body */}
                                            <tbody className="bg-gray-300 divide-y">
                                                {students.map((student, index) => ( //iterate over students
                                                    <tr className="hover:bg-accent-light" key={`${courseCode}-student-${index}`}>
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
                                    //Note: again the back-end should send only the courses that has been registed by students but it won't hurt checking twice
                                    <p className="p-4 text-center text-gray-600">No students found for this course.</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    //if search has no results show this message
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No courses found matching "{searchTerm1}".
                    </div>
                )}
            </div>
        );
    }

    // Report type 2: Form Course Statistics -----------------------------
    if (typeOfReport === 2) {
        const courseStats = reportJson?.course_stats ?? {}; //same as above

        const filteredCourseStats = Object.entries(courseStats).filter( //same as above
            ([courseCode]) => courseCode.toLowerCase().includes(searchTerm2.toLowerCase())
        );


        if (!courseStats || Object.keys(courseStats).length === 0) { //same as above
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white">No course statistics available.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-4">
                {/* title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-primary-dark">
                    Course Statistics Report
                </h1>

                {/* search bar */}
                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow"> 
                    <input
                        type="text"
                        placeholder="Search by Course Code (e.g., CPIT-250)..."
                        value={searchTerm2} 
                        onChange={handleSearchChange2} 
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>
                
                {filteredCourseStats.length > 0 ? ( //same as above
                    <div className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                        {/* header */}
                        <div className="p-4 bg-primary-dark">
                            <h2 className="text-lg font-medium text-white">
                                Statistics Summary
                            </h2>
                        </div>
                        {/* content */}
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.2)]">
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
                                    {/* table body */}
                                    <tbody className="bg-gray-300 divide-y">
                                        {filteredCourseStats.map(([courseCode, stats]) => (
                                            <tr key={courseCode} className="hover:bg-accent-light">
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
                    //same as above
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No course statistics found matching "{searchTerm2}".
                    </div>
                )}
            </div>
        );
    }

    // Report Type 3: Graduating Student Courses -----------------------------
    if (typeOfReport === 3) {
        const graduatingStudents = reportJson?.graduating_students ?? []; //same as above

        const filteredGraduatingStudents = graduatingStudents.filter(student => //same as above
            student?.university_student_id?.toLowerCase().includes(searchTerm3.toLowerCase())
        );


        //same as above
        if (!graduatingStudents || graduatingStudents.length === 0) {
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white">No graduating student data available.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-4">
                {/* title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-primary-dark">
                    Graduating Students Report
                </h1>

                {/* search bar */}
                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow">
                    <input
                        type="text"
                        placeholder="Search by University ID..."
                        value={searchTerm3}
                        onChange={handleSearchChange3}
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>

                {filteredGraduatingStudents.length > 0 ? (
                    <div className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                        {/* header */}
                        <div className="p-4 bg-primary-dark">
                            <h2 className="text-lg font-medium text-white">
                                Student Details
                            </h2>
                        </div>
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.2)]">
                                    <thead className="bg-primary-light">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Name</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">University ID</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r">Email</th>
                                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">GPA</th>
                                        </tr>
                                    </thead>
                                    {/* table body */}
                                    <tbody className="bg-gray-300 divide-y">
                                        {filteredGraduatingStudents.map((student, index) => (
                                            <tr className="hover:bg-accent-light" key={`grad-student-${index}`}>
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
                    //same as above
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No graduating students found matching "{searchTerm3}".
                    </div>
                )}
            </div>
        );
    }

    // Report type 4: Generate Section Schedule -----------------------------
    if (typeOfReport === 4) {
        const sectionAssignments = reportJson?.section_assignments ?? {}; //same as above
        const schedulePreference = reportJson?.schedule_preference ?? 'Not specified'; //same as above

        const filteredAssignments = Object.entries(sectionAssignments).filter( //same as above
            ([courseCode]) => courseCode.toLowerCase().includes(searchTerm4.toLowerCase())
        );

        if (!sectionAssignments || Object.keys(sectionAssignments).length === 0) { //same as above
            return (
                <div className="border border-primary-dark rounded-lg shadow-sm bg-primary-dark">
                    <div className="p-6">
                        <p className="text-center text-white">No section schedule data available.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 p-4">
                {/* title */}
                <h1 className="text-2xl font-semibold mb-6 text-center text-primary-dark">
                    Generated Section Schedule Report
                </h1>

                {/* here is something extra where I show the Schedule Prefrence */}
                <div className="p-4 bg-gray-200 rounded-lg shadow mb-6">
                    <p className="text-center text-gray-800">
                        <span className="font-semibold">Schedule Preference:</span> {schedulePreference.replace(/([A-Z])/g, ' $1').trim()} {/* I added space before capitals by finding A-Z then push it by a space */}
                    </p>
                </div>


                <div className="mb-6 p-4 bg-gray-200 rounded-lg shadow">
                    <input
                        type="text"
                        placeholder="Search by Course Code (e.g., CPIS-334)..."
                        value={searchTerm4}
                        onChange={handleSearchChange4}
                        className="w-full px-4 py-2 border border-gray rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>

                {filteredAssignments.length > 0 ? ( //same as above
                    filteredAssignments.map(([courseCode, sections]) => (
                        <div key={courseCode} className="border border-primary-dark rounded-lg shadow-sm bg-gray-100 overflow-hidden">
                            {/* header */}
                            <div className="p-4 bg-primary-dark">
                                <h2 className="text-lg font-medium text-white">Course: {courseCode}</h2>
                            </div>
                            <div className="p-4 space-y-4"> 
                                {sections && sections.length > 0 ? ( //here we check if there are sections for the course
                                    sections.map((section, sectionIndex) => (
                                        <div key={`${courseCode}-section-${sectionIndex}`} className="border border-gray-300 rounded-md bg-gray-50 p-3">
                                            <h3 className="text-md font-semibold text-primary-dark mb-2">{section.section_name ?? 'Unnamed Section'}</h3>
                                            {section.slots && section.slots.length > 0 ? ( //here we check if there are slots for the section
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {section.slots.map((slot, slotIndex) => (
                                                        <li key={`${courseCode}-section-${sectionIndex}-slot-${slotIndex}`}>
                                                            <span className="font-medium">{slot.day ?? 'N/A'}</span>: {slot.start ?? 'N/A'} - {slot.end ?? 'N/A'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No time slots assigned.</p> //if there are no slots for the section
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-gray-600">No sections found for this course.</p> //if there are no sections for the course
                                )}
                            </div> {/* NOTE: by default the backend should have all of those info already and doesn't send empty values however, checking twice isn't a bad thing */}
                        </div>
                    ))
                ) : (
                    //same as above
                    <div className="text-center p-4 text-gray-600 bg-gray-100 rounded-lg border border-gray-300">
                        No sections found matching "{searchTerm4}".
                    </div>
                )}
            </div>
        );
    }


    // Default: invalid Report type or no data
    // just in case if the state is not empty and get here althougt I handled it in the useEffect to redirect
    // also this handle if typeOfReport isn't 1-4 in any case
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

export default ShowReport;
