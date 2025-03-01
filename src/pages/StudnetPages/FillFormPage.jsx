    //the logic i'm trying to do is first instead of editing the check box event I will edit based on boolean value so that
    //if that boolean is true then make the check box done 
    //the boolean value will be stored in show_courses so for every course there will be boolean value for
    //its check box
    //by doing this the search will be easier to handle so that every time I search it won't disappear

import { useState, useEffect } from "react";

const FillFormPage = () => {

    const available_courses = [ //we take this form the backend server so we might need to get api here or somewhere else to get this data
        { "CODE": "CPIT221", "level": 1, "prerequisites": [] },
        { "CODE": "CPIT250", "level": 4, "prerequisites": ["CPCS204"] },
        { "CODE": "CPIT251", "level": 5, "prerequisites": ["CPCS204", "CPIT250"] }
    ];

    const finished_courses = [ //we also take this from the backend server 
        { "CODE": "CPIT221" }, //note to self: I need to pass thoose info before loading the page like to parent ( student home page)
        { "CODE": "ARAB201" }
    ];

    const [show_courses, set_show_courses] = useState([]);
    const [filtered_courses, set_filtered_courses] = useState([]); //we will use this for search filtering

    //here I used useEffect because I want to run this code only once so that the search will not run this code again
    useEffect(() => {
        const show_courses_temp = available_courses
            // filter available courses that are not in finished_courses
            .filter(e => !finished_courses.some(finished => finished.CODE === e.CODE))
            .map(e => ({ ...e, isChecked: false }));

        set_show_courses(show_courses_temp);
        set_filtered_courses(show_courses_temp); //this makes sure we have a copy for filtering
    }, []); // empty dependency array makes it run only on mount




    const handleCheckboxChange = (courseCode) => { //here we toggle the isChecekd in the show_courses array
        set_show_courses(prevCourses =>
            prevCourses.map(course =>
                course.CODE === courseCode ? { ...course, isChecked: !course.isChecked } : course
            )
        );
        //repeat for the filtered courses
        set_filtered_courses(prevCourses =>
            prevCourses.map(course =>
                course.CODE === courseCode ? { ...course, isChecked: !course.isChecked } : course
            )
        );

    };

    const updateBasedOnSearch = (searchQuery) => {
        if (!searchQuery) {
            set_filtered_courses(show_courses); // reset if search is empty
        } else {
            set_filtered_courses(show_courses.filter(course =>
                course.CODE.toLowerCase().includes(searchQuery.toLowerCase()) //here we edited the filtered courses not the original by doing this we can retrive it after the search
            ));
        }
    };

    //TODO workload 😭
    // const workloadPercentage = (selectedCourses.length / show_courses.length) * 100;

    return (
        <div>
            <h2>Workload Bar</h2>
            <div></div>
            <input type="text" placeholder="Search" onChange={(e) => updateBasedOnSearch(e.target.value)} />

            <div>
                {filtered_courses.map(course => ( //by default I will show the filtered courses in case of a search happnes 
                    <div key={course.CODE}>
                        <input type="checkbox" id={course.CODE} checked={course.isChecked} onChange={() => handleCheckboxChange(course.CODE)} />
                        <label htmlFor={course.CODE}>{course.CODE}
                            {/* {course.CODE === "CPIT250" ? "(recommended)" : ""} TODO need to handle the recommended logic here */}
                        </label>
                    </div>
                ))}
            </div>
            <button>Submit</button>
        </div>
    );
}

export default FillFormPage;
