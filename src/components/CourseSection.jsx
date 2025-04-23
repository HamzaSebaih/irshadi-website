import { useState } from "react";

const CourseSection = ({ title, courses, isUnavailable = false, isRecommended = false, selectedCourses, handleCheckboxChange }) => {
    const [isOpen, setIsOpen] = useState(true); // State to manage dropdown visibility, default true (open)

    const toggleOpen = () => setIsOpen(!isOpen); // Function to toggle the state

    if (!courses || courses.length === 0) return null; // Don't render empty sections

    // Determine styles based on section type (used for default backgrounds)
    const baseBorderColor = isRecommended ? 'border-green-300' : isUnavailable ? 'border-danger-DEFAULT' : 'border-gray-300';
    const headerBgColor = isRecommended ? 'bg-green-100' : isUnavailable ? 'bg-danger-light' : 'bg-gray-100';
    const headerTextColor = isRecommended ? 'text-green-800' : isUnavailable ? 'text-danger-dark' : 'text-gray-700';
    // Define default item background colors
    const defaultItemBgColor = isRecommended ? 'bg-green-50' : isUnavailable ? 'bg-red-50' : 'bg-white';

    return (
        <div className={`border ${baseBorderColor} rounded-lg shadow-sm overflow-hidden`}>
            {/* Section Header - Now Clickable */}
            <h3
                className={`flex justify-between items-center text-lg font-semibold p-3 ${headerBgColor} ${headerTextColor} ${isOpen ? 'rounded-t-lg' : 'rounded-lg'} cursor-pointer transition-colors duration-150 ease-in-out`}
                onClick={toggleOpen} // Add onClick handler
            >
                <span>{title}</span>
                {/* Arrow Icon for Dropdown Indication */}
                <span className={`transform transition-transform duration-200 ease-in-out ${isOpen ? '' : '-rotate-90'}`}> {/* Rotate arrow */}
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </span>
            </h3>

            {/* Course List - Conditionally Rendered */}
            {isOpen && (
                <ul className="divide-y divide-gray-200 border-t border-[inherit]"> {/* Use inherit to match header border */}
                    {courses.map(course => {
                        const courseId = isUnavailable ? course.id : course;
                        const reason = isUnavailable ? course.reason : null;
                        const isChecked = !isUnavailable && selectedCourses.includes(courseId);
                        const isDisabled = isUnavailable; // Disable unavailable courses

                        // Determine background color based on state
                        const currentBgColor = isDisabled
                            ? defaultItemBgColor // Keep default red/white for disabled
                            : isChecked
                              ? (isRecommended ? 'bg-green-300' : 'bg-blue-200') // Selected: Darker green or selection blue
                              : defaultItemBgColor; // Not selected: Default green/white

                        return (
                            <li
                                key={courseId}
                                onClick={() => { // Add onClick handler to the list item
                                    if (!isDisabled) {
                                        handleCheckboxChange(courseId); // Call the existing handler if not disabled
                                    }
                                }}
                                className={`
                                    p-3 flex items-center justify-between
                                    ${currentBgColor}
                                    ${isDisabled
                                        ? 'opacity-60' // Apply opacity if disabled
                                        : 'cursor-pointer hover:bg-opacity-80' // Make clickable and add hover effect if not disabled
                                    }
                                    transition-colors duration-150 ease-in-out
                                `}
                            >
                                {/* Removed the checkbox input */}
                                <span className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'} ${isRecommended ? 'font-bold' : ''}`}>
                                    {courseId}
                                    {isRecommended && <span className="ml-2 text-xs font-normal text-green-700 bg-green-100 px-1.5 py-0.5 rounded">(Recommended)</span>}
                                    {/* Optional: Add a checkmark icon for selected items */}
                                    {/* {isChecked && <span className="ml-2 text-primary">✓</span>} */}
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