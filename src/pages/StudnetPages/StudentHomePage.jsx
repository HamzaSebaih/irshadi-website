const StudentHomePage = ()=>{

    const surveyID=0;
    const date= "2024/9/11"
    return(
        <>
        <div className="student-info-div">
            <h1>Current Student Info</h1>
            <p>Name:</p>
            <p>Current progress:</p>
            <p>Last updated:</p>
            
        </div>
        
        <div className="avaliable-surveys-div">
            <h1>Avaliable Surveys</h1>
            <div className="survey-lists">
                <p>Survey ID: {surveyID} Due Date: {date}</p>
                <button>fill</button>
            </div>
        </div>
        </>
    )
    }
    
    
    export default StudentHomePage