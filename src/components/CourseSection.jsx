import { useState } from "react";

const CourseSection = ({ title, courses, isUnavailable = false, isRecommended = false, selectedCourses, handleCheckboxChange }) => {
    const [isOpen, setIsOpen] = useState(true); // state to manage dropdown visibility default value is open

    const toggleOpen = () => setIsOpen(!isOpen); //if clicked change its state like toggle

    if (!courses || courses.length === 0) return null; // check if empty just return null

    // here I style based on section type
    //if recommended make it green if not check if unavailabe then make it red else which will be normal course then make it gray
    const baseBorderColor = isRecommended ? 'border-green-300' : isUnavailable ? 'border-danger-DEFAULT' : 'border-gray-300';
    const headerBgColor = isRecommended ? 'bg-green-100' : isUnavailable ? 'bg-danger-light' : 'bg-gray-100';
    const headerTextColor = isRecommended ? 'text-green-800' : isUnavailable ? 'text-danger-dark' : 'text-gray-700';
    const defaultItemBgColor = isRecommended ? 'bg-green-50' : isUnavailable ? 'bg-red-50' : 'bg-white';

    return (
        <div className={`border ${baseBorderColor} rounded-lg shadow-sm overflow-hidden`}>
            {/* section header*/}
            <h3
                className={`flex justify-between items-center text-lg font-semibold p-3 ${headerBgColor} ${headerTextColor} ${isOpen ? 'rounded-t-lg' : 'rounded-lg'} cursor-pointer transition-colors duration-150 ease-in-out`}
                onClick={toggleOpen} //to close it or open it when clicked
            >
                <span>{title}</span>
                {/* arrow Icon for dropdown */}
                <span className={`transform transition-transform duration-200 ease-in-out ${isOpen ? '' : '-rotate-90'}`}> {/* rotate arrow if open or closed */}
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </span>
            </h3>

            {/* course List */}
            {isOpen && (
                <ul className="divide-y divide-gray-200 border-t border-[inherit]"> {/* inherit to match header border */}
                    {courses.map(course => {
                        const courseId = isUnavailable ? course.id : course;
                        const reason = isUnavailable ? course.reason : null;
                        const isChecked = !isUnavailable && selectedCourses.includes(courseId);
                        const isDisabled = isUnavailable;

                        // background color based on state
                        const currentBgColor = isDisabled
                            ? defaultItemBgColor // keep default red/white for disabled
                            : isChecked //else check if clicked or not
                                ? (isRecommended ? 'bg-green-300' : 'bg-blue-200') // Selected: darker color
                                : defaultItemBgColor; // Not selected: default green/white

                        return (
                            <li
                                key={courseId}
                                onClick={() => {
                                    if (!isDisabled) {
                                        handleCheckboxChange(courseId); // this trigger a function in the page not here
                                    }
                                }}
                                className={`
                                    p-3 flex items-center justify-between
                                    ${currentBgColor}
                                    ${isDisabled
                                        ? 'opacity-60'
                                        : 'cursor-pointer hover:bg-opacity-80' // add hover effect if not disabled
                                    }
                                    transition-colors duration-150 ease-in-out
                                `}
                            >
                                {/* inside the <li>*/}
                                <span className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'} ${isRecommended ? 'font-bold' : ''}`}>
                                    {courseId}
                                    {isRecommended && <span className="ml-2 text-xs font-normal text-green-700 bg-green-100 px-1.5 py-0.5 rounded">(Recommended)</span>}
                                </span>

                                {reason && <span className="text-sm text-danger-dark">{reason}</span>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default CourseSection;