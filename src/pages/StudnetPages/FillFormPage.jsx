import { useState } from "react";

const FillFormPage = () => {

    const available_courses = [ //we take this form the backend server so we might need to get api here or somewhere else to get this data
        { "CODE": "CPIT221", "level": 1, "prerequisites": [] },
        { "CODE": "CPIT250", "level": 4, "prerequisites": ["CPCS204"] },
        { "CODE": "CPIT251", "level": 5, "prerequisites": ["CPCS204", "CPIT250"] }
    ]

    const finished_courses = [ //we also take this from the backend server 
        { "CODE": "CPIT221" },
        { "CODE": "ARAB201" }
    ]

    // filter available courses that are not in finished_courses
    const show_courses = available_courses.filter(e =>
        !finished_courses.some(finished => finished.CODE === e.CODE)
    );

    const [selectedCourses, setSelectedCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const handleCheckboxChange = (course) => {
        setSelectedCourses(prevSelected =>
            prevSelected.includes(course)
                ? prevSelected.filter(c => c !== course)
                : [...prevSelected, course]
        );
    };

    const filteredCourses = show_courses.filter(course =>
        course.CODE.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const workloadPercentage = (selectedCourses.length / show_courses.length) * 100;



    return (
        <div>
            <div>
                <h2>Workload Bar</h2>
                <div></div>
                <input type="text" placeholder="Search" onChange={(e) => setSearchTerm(e.target.value)}/>

                <div>
                    {filteredCourses.map(course => (
                        <div key={course.CODE}>
                            <input
                                type="checkbox"
                                id={course.CODE}
                                checked={selectedCourses.includes(course.CODE)}
                                onChange={() => handleCheckboxChange(course.CODE)}
                            />
                            <label htmlFor={course.CODE}>{course.CODE} {course.CODE === "CPIT250" ? "(recommended)" : ""}</label>
                        </div>
                    ))}
                </div>

                <button>Submit</button>
            </div>
        </div>
    );
}

export default FillFormPage