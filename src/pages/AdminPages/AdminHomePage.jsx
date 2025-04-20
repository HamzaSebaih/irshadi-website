import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext"; // Assuming path is correct

const AdminHomePage = () => {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const [updateTheTable, setUpdateTheTable] = useState(true) //
  const [formsTable, setFormTable] = useState([]) //
  const [formThatWantToBeDeleted, setFormThatWantToBeDeleted] = useState(null) //
  const [deleteConfirmPopUp, setDeleteConfirmPopUp] = useState(false) //
  const [isPopUpForAddingClicked, setIsPopUpForAddingClicked] = useState(false) //
  const [isLoading, setIsLoading] = useState(true) //
  const [plans, setPlans] = useState([]) //
  const [newFormName, setNewFormName] = useState("") //
  const [newFormDescription, setNewFormDescription] = useState(''); //
  const [newFormStartDate, setNewFormStartDate] = useState(''); //
  const [newFormEndDate, setNewFormEndDate] = useState(''); //
  const [newFormPlan, setNewFormPlan] = useState(''); //
  const [newFormMaxHours, setNewFormMaxHours] = useState(''); //
  const [newFormMaxGraduateHours, setNewFormMaxGraduateHours] = useState(''); //
  const [newFormExpectedStudents, setNewFormExpectedStudents] = useState(''); //
  const [isPopUpForEditingClicked, setIsPopUpForEditingClicked] = useState(false) //
  const [isPopUpForReportsClicked, setIsPopUpForReportsClicked] = useState(false) //
  const [formThatWantToBeEdited, setFormThatWantToBeEdited] = useState(null) //
  const [formThatWantToPrintReport, setFormThatWantToPrintReport] = useState(null) //
  const [isPopUpForSpecificCourseClicked, setIsPopUpForSpecificCourseClicked] = useState(false) //
  const [isPopUpForAiClicked, setIsPopUpForAiClicked] = useState(false) //
  const [specificCourse, setSpecificCourse] = useState(null) //
  const [sectionCapacity,setSectionCapacity] = useState("") //
  const [timePreference,setTimePreference] = useState("") //
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetchForms().finally(() => setIsLoading(false));
    fetchPlans();
    setUpdateTheTable(false);
  }, [updateTheTable, user]);

  const fetchForms = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/getForms`, {
        method: "GET",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setFormTable(data.forms);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setFormTable([]);
    }
  };
  const fetchPlans = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/getPlans`, {
        method: "GET",
        headers: {
          "Authorization": `${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      console.error("Error fetching extra info:", error);
      setPlans([]);
    }
  };

  const onDelete = () => {
    setDeleteConfirmPopUp(true)
  };
  const handleDeleteConfirmed = async () => {
    try {
      if (formThatWantToBeDeleted) {
        const token = await user.getIdToken();
        const response = await fetch(`${backendIp}/deleteForm`, {
          method: "POST",
          headers: {
            "Authorization": `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ form_id: formThatWantToBeDeleted }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        setUpdateTheTable(true)
      }
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const formatDate = (inputDateString) => {
    const date = new Date(inputDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const handleSubmitForm = (e) => {
     e.preventDefault();
    if (newFormStartDate && newFormEndDate) {
      const start = new Date(newFormStartDate);
      const end = new Date(newFormEndDate);

      if (end < start) {
        alert('Please make sure the Start is before The End Date');
      } else {
        handleAddNewForm().finally(() => {
          setNewFormName('');
          setNewFormDescription('');
          setNewFormStartDate('');
          setNewFormEndDate('');
          setNewFormPlan('');
          setNewFormMaxHours('');
          setNewFormMaxGraduateHours('');
          setNewFormExpectedStudents('');
          setIsPopUpForAddingClicked(false);
          setUpdateTheTable(true);
        });

      }
    }
  }

  const handleAddNewForm = async () => {
    try {
      const token = await user.getIdToken();
      const body = {
        title: newFormName,
        description: newFormDescription,
        start_date: newFormStartDate,
        end_date: newFormEndDate,
        plan: newFormPlan,
        max_hours: Number(newFormMaxHours),
        max_graduate_hours: Number(newFormMaxGraduateHours),
        expected_students: Number(newFormExpectedStudents),
      };
      const response = await fetch(`${backendIp}/addForm`, {
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

  const handleEditForm = async (e) => {
    e.preventDefault();
    console.log(formThatWantToBeEdited)
    const startDateValue = formThatWantToBeEdited.start_date instanceof Date
        ? formThatWantToBeEdited.start_date
        : new Date(formThatWantToBeEdited.start_date);
    const endDateValue = formThatWantToBeEdited.end_date instanceof Date
        ? formThatWantToBeEdited.end_date
        : new Date(formThatWantToBeEdited.end_date);

    if (endDateValue < startDateValue) {
      alert('Please make sure the Start is before The End Date');
    }
    else {
      try {
        const token = await user.getIdToken();
        const body = {
          form_id: formThatWantToBeEdited.form_id,
          title: formThatWantToBeEdited.title,
          description: formThatWantToBeEdited.description,
          start_date: typeof formThatWantToBeEdited.start_date === 'string'
                      ? formThatWantToBeEdited.start_date
                      : formatDate(formThatWantToBeEdited.start_date),
          end_date: typeof formThatWantToBeEdited.end_date === 'string'
                      ? formThatWantToBeEdited.end_date
                      : formatDate(formThatWantToBeEdited.end_date),
        };
        const response = await fetch(`${backendIp}/editForm`, {
          method: "PATCH",
          headers: {
            "Authorization": `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...body }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        setUpdateTheTable(true)
        setIsPopUpForEditingClicked(false)

      } catch (error) {
        console.error("Error editing form:", error);
        alert(`Failed to edit form: ${error.message}`);
      }
    }
  };

  const getAllCoursesInPlan = (formData) => {
    if (!formData || !plans) return [];
    const plan_id = formData.plan_id;
    const plan = plans.find(p => p.plan_id === plan_id);
    if (plan && plan.levels) {
      return Object.values(plan.levels).flat();
    } else {
      return [];
    }
  }

  const getAllCoursePriorityLists = async () => {
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendIp}/getAllCoursePriorityLists`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id }),
        });
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error("No Responses avaliable !")
            }
            else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        }
        const data = await response.json();
        console.log("All Course Priority Lists Report:", data)
        alert("All Course Priority Lists report generated! Check console.");
        setIsPopUpForReportsClicked(false)
    } catch (error) {
        console.error("Error in Reports (All Courses):", error);
        alert(error)
    }
  }

  const getCoursePriorityList = async () => {
    if (!specificCourse) {
        alert("Please select a specific course first.");
        return;
    }
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendIp}/getCoursePriorityList`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id, course_id: specificCourse }),
        });
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error("No Responses avaliable !")
            }
            else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        }
        const data = await response.json();
        console.log(`Specific Course (${specificCourse}) Priority List Report:`, data);
        alert(`Report for ${specificCourse} generated! Check console.`);
        setIsPopUpForSpecificCourseClicked(false)
        setIsPopUpForReportsClicked(false)
    } catch (error) {
        console.error("Error in Reports (Specific Course):", error);
        alert(error)
    }
  }

  const getFormCourseStats = async () => {
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendIp}/getFormCourseStats`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id }),
        });
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error("No Responses avaliable !")
            }
            else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        }
        const data = await response.json();
        console.log("Form Course Stats Report:", data)
        alert("Form Course Stats report generated! Check console.");
        setIsPopUpForReportsClicked(false)
    } catch (error) {
        console.error("Error in Reports (Course Stats):", error);
        alert(error)
    }
  }

  const getGraduatingStudentCourses = async () => {
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendIp}/getGraduatingStudentCourses`, {
            method: "POST",
            headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id }),
        });
        if (!response.ok) {
            if (response.status === 500) {
                throw new Error("No Responses avaliable !")
            }
            else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        }
        const data = await response.json();
        console.log("Graduating Student Courses Report:", data)
        alert("Graduating Student Courses report generated! Check console.");
        setIsPopUpForReportsClicked(false)
    } catch (error) {
        console.error("Error in Reports (Graduating Students):", error);
        alert(error)
    }
  }

  const generateSectionSchedule = async () => {
    if (!formThatWantToPrintReport) {
        alert("Error: No form selected for AI schedule generation.");
        return;
    }
    try {
      let body ={}
      if(sectionCapacity !="" && timePreference != ""){
         body = {
          form_id: formThatWantToPrintReport.form_id,
          sectionCapacity: Number(sectionCapacity),
          timePreference:timePreference
        }
      } else if(sectionCapacity != ""){
         body = {
          form_id: formThatWantToPrintReport.form_id,
          sectionCapacity: Number(sectionCapacity),
        }
      } else if(timePreference != ""){
         body = {
          form_id: formThatWantToPrintReport.form_id,
          timePreference:timePreference
        }
      } else{
         body = {
          form_id: formThatWantToPrintReport.form_id,
        }
      }
      console.log("Generating AI Schedule with body:", body)

      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/generateSectionSchedule`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body }),
      });
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error("No Responses avaliable !")
        }
        else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

      }
      const data = await response.json();
      console.log("AI Schedule Data:", data)
      alert("AI schedule generated successfully! Check console.");
      setIsPopUpForAiClicked(false)
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error generating AI Schedule:", error);
      alert(error)
    }
    finally{
      setTimePreference("")
      setSectionCapacity("")
    }
  }



  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  } 

  return (
    <>
      {/* Main Page Layout */}
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h1 className="text-2xl font-semibold text-gray-900">Manage Forms</h1>
            {/* Add Button */}
            <button
              onClick={() => setIsPopUpForAddingClicked(true)} // Use original state setter
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Create New Form
            </button>
          </div>

          {/* Forms Grid or Empty State */}
          {formsTable.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {formsTable.map((form) => { //
                // Calculate completion percentage
                const completion = form.expected_students > 0 //
                  ? Math.round((form.responses / form.expected_students) * 100) //
                  : 0; //
                const clampedCompletion = Math.min(completion, 100); //

                return (
                  // Cards based on forms
                  <div key={form.form_id} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                     {/* Card Header */}
                     <div className="p-4">
                        <h2 className="truncate text-lg font-semibold text-gray-900" title={form.title}>{form.title}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600" title={form.description}>{form.description || 'No description'}</p>
                    </div>

                     {/* Card Body */}
                     <div className="flex-grow p-4">
                        {/* Dates */}
                        <div className="mb-3 space-y-1 text-sm text-gray-500">
                            <div><strong>Start:</strong> {formatDate(form.start_date)}</div>
                            <div><strong>End:</strong> {formatDate(form.end_date)}</div>
                        </div>

                        {/* Stats */}
                        <div className="mb-3 space-y-1 text-sm text-gray-500">
                             <div><strong>Responses:</strong> {form.responses ?? 'N/A'}</div>
                             <div><strong>Expected:</strong> {form.expected_students ?? 'N/A'}</div>
                        </div>

                        {/* Progress Bar */}
                        {form.expected_students > 0 && ( 
                            <div className="mt-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Completion</span>
                                    <span>{clampedCompletion}%</span>
                                </div>
                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                    {/* Styled progress bar using theme color */}
                                    <div
                                        className="h-2 rounded-full bg-primary"
                                        style={{ width: `${clampedCompletion}%` }} //
                                    ></div>
                                </div>
                            </div>
                        )}
                     </div>

                    {/* Card Footer Actions - Using original state setters and logic handlers */}
                    <div className="flex border-t border-gray-200 bg-gray-50">
                        <button
                          title="Delete Form"
                          className="flex-1 border-r border-gray-200 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-danger"
                          onClick={() => { //
                              setFormThatWantToBeDeleted(form.form_id); // Use original state setter
                              onDelete(); // Use original handler
                          }}
                      >
                          Delete
                      </button>
                      <button
                          title="Edit Form"
                          className="flex-1 border-r border-gray-200 px-4 py-3 text-sm font-medium text-accent-dark hover:bg-accent/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-accent"
                          onClick={() => { //
                              setFormThatWantToBeEdited(form); // Use original state setter
                              setIsPopUpForEditingClicked(true); // Use original state setter
                          }}
                      >
                          Edit
                      </button>
                      <button
                          title="View Reports"
                          className="flex-1 px-4 py-3 text-sm font-medium text-primary-dark hover:bg-primary/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary"
                          onClick={() => { //
                              setFormThatWantToPrintReport(form); // Use original state setter
                              setIsPopUpForReportsClicked(true); // Use original state setter
                          }}
                      >
                          Reports
                      </button>
                    </div>
                  </div>
                ); //
              })}
            </div>
          ) : (
            // Styled Empty State
            <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new form.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsPopUpForAddingClicked(true)} // Use original state setter
                  className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                   Create New Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      {/* Add Form Modal */}
      {isPopUpForAddingClicked && ( //
        // Styled Modal Wrapper
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPopUpForAddingClicked(false)} // Use original state setter
        >
          {/* Styled Modal Content Box */}
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Create a new Form</h2>

            {/* Form using original state and handlers */}
            <form onSubmit={handleSubmitForm}> {/* Use original handler */}
               {/* Styled Inputs using original state variables */}
              <div className="mb-4">
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Form Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="title" // Keep ID consistent if needed elsewhere, though label uses 'title'
                  value={newFormName} // Original state
                  onChange={(e) => setNewFormName(e.target.value)} // Original setter
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter Form Name"
                  required //
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Description <span className="text-danger">*</span></label>
                <textarea
                  id="description" //
                  value={newFormDescription} // Original state
                  onChange={(e) => setNewFormDescription(e.target.value)} // Original setter
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter description"
                  required //
                  rows={3}
                />
              </div>

               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div>
                    <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-gray-700">Start Date <span className="text-danger">*</span></label>
                    <input
                    type="date"
                    id="start_date" //
                    value={newFormStartDate} // Original state
                    onChange={(e) => setNewFormStartDate(e.target.value)} // Original setter
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required //
                    />
                 </div>
                 <div>
                    <label htmlFor="end_date" className="mb-1 block text-sm font-medium text-gray-700">End Date <span className="text-danger">*</span></label>
                    <input
                    type="date"
                    id="end_date" //
                    value={newFormEndDate} // Original state
                    onChange={(e) => setNewFormEndDate(e.target.value)} // Original setter
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required //
                    />
                 </div>
              </div>

              <div className="mb-4">
                <label htmlFor="plan" className="mb-1 block text-sm font-medium text-gray-700">Plan <span className="text-danger">*</span></label>
                <select
                  id="plan" //
                  value={newFormPlan} // Original state
                  onChange={(e) => setNewFormPlan(e.target.value)} // Original setter
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required //
                >
                  <option value="" disabled>Select a plan</option> {/* */}
                  {plans.map((plan) => ( //
                    <option key={plan.plan_id} value={plan.plan_id}> {/* */}
                      {plan.plan_id} {/* Display plan ID */}
                    </option> //
                  ))}
                </select>
              </div>

               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div>
                    <label htmlFor="max_hours" className="mb-1 block text-sm font-medium text-gray-700">Max Hours <span className="text-danger">*</span></label>
                    <input
                    type="number"
                    id="max_hours" //
                    value={newFormMaxHours} // Original state
                    onChange={(e) => setNewFormMaxHours(e.target.value)} // Original setter
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="e.g., 18"
                    min="1" //
                    required //
                    />
                 </div>
                <div>
                    <label htmlFor="max_graduate_hours" className="mb-1 block text-sm font-medium text-gray-700">Max Graduate Hours <span className="text-danger">*</span></label>
                    <input
                    type="number"
                    id="max_graduate_hours" //
                    value={newFormMaxGraduateHours} // Original state
                    onChange={(e) => setNewFormMaxGraduateHours(e.target.value)} // Original setter
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="e.g., 21"
                    min={newFormMaxHours || "1"} // Ensure min is at least maxHours or 1
                    required //
                    />
                </div>
              </div>

              <div className="mb-4">
                 <label htmlFor="expected_students" className="mb-1 block text-sm font-medium text-gray-700">Expected Students <span className="text-danger">*</span></label>
                 <input
                  type="number"
                  id="expected_students" //
                  value={newFormExpectedStudents} // Original state
                  onChange={(e) => setNewFormExpectedStudents(e.target.value)} // Original setter
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="e.g., 500"
                  min="1" //
                  required //
                />
              </div>

              {/* Styled Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPopUpForAddingClicked(false)} // Use original state setter
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit" // Submit triggers handleSubmitForm
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Add Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Delete Confirmation Modal - Controlled by deleteConfirmPopUp */}
       {deleteConfirmPopUp && ( //
          // Styled Modal Wrapper
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => { //
              setFormThatWantToBeDeleted(null); //
              setDeleteConfirmPopUp(false); // Use original state setter
            }}
           >
            {/* Styled Modal Content Box */}
            <div
                className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()} //
            >
                 <h2 className="mb-4 text-xl font-semibold text-gray-800">Confirm Deletion</h2>
                 <p className="mb-6 text-sm text-gray-600">
                    Are you sure you want to delete this Form? This action cannot be undone.
                 </p>
                 {/* Styled Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                        onClick={() => { //
                          setFormThatWantToBeDeleted(null); //
                          setDeleteConfirmPopUp(false); // Use original state setter
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger-dark focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                        onClick={() => { //
                          handleDeleteConfirmed() // Use original handler
                          setFormThatWantToBeDeleted(null); //
                          setDeleteConfirmPopUp(false); // Use original state setter
                        }}
                      >
                        Delete
                      </button>
                </div>
            </div>
          </div>
        )}

        {/* Edit Form Modal - Controlled by isPopUpForEditingClicked */}
       {isPopUpForEditingClicked && formThatWantToBeEdited && ( //
            // Styled Modal Wrapper
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setIsPopUpForEditingClicked(false)} // Use original state setter
            >
                 {/* Styled Modal Content Box */}
                <div
                    className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()} //
                >
                    <h2 className="mb-4 text-xl font-semibold text-gray-800">Edit Form</h2>

                    {/* Form using original state and handlers */}
                    <form onSubmit={handleEditForm}> {/* Use original handler */}
                         {/* Styled Inputs using original state variable 'formThatWantToBeEdited' */}
                        <div className="mb-4">
                            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Title <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                id="title" //
                                value={formThatWantToBeEdited.title} // Original state object property
                                onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ // Original setter logic
                                ...prevForm, // keep the existing properties
                                title: e.target.value, //
                                }))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="Enter plan title"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Description <span className="text-danger">*</span></label>
                            <textarea
                                id="description" //
                                value={formThatWantToBeEdited.description} // Original state object property
                                onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ // Original setter logic
                                ...prevForm, // keep the existing properties
                                description: e.target.value, //
                                }))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="Enter description"
                                required //
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-gray-700">Start Date <span className="text-danger">*</span></label>
                                <input
                                    type="date"
                                    id="start_date" //
                                    value={formatDate(formThatWantToBeEdited.start_date)} // Use original formatter with original state
                                    onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ // Original setter logic
                                    ...prevForm, // keep the existing properties
                                    start_date: e.target.value, // Store as string YYYY-MM-DD
                                    }))}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                    required //
                                />
                            </div>
                            <div>
                                <label htmlFor="end_date" className="mb-1 block text-sm font-medium text-gray-700">End Date <span className="text-danger">*</span></label>
                                <input
                                    type="date"
                                    id="end_date" //
                                    value={formatDate(formThatWantToBeEdited.end_date)} // Use original formatter with original state
                                     onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ // Original setter logic
                                        ...prevForm, // keep the existing properties
                                        end_date: e.target.value, // Store as string YYYY-MM-DD
                                     }))}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                    required //
                                />
                            </div>
                         </div>

                        {/* Display non-editable fields for context - styled */}
                        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                            <p className="text-gray-600"><strong>Plan ID:</strong> {formThatWantToBeEdited.plan_id}</p>
                            <p className="text-gray-600"><strong>Max Hours:</strong> {formThatWantToBeEdited.max_hours}</p>
                            <p className="text-gray-600"><strong>Max Graduate Hours:</strong> {formThatWantToBeEdited.max_graduate_hours}</p>
                            <p className="text-gray-600"><strong>Expected Students:</strong> {formThatWantToBeEdited.expected_students}</p>
                        </div>

                         {/* Styled Action Buttons */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button" // Changed from submit to button if handleEditForm is manually called
                                onClick={() => setIsPopUpForEditingClicked(false)} // Use original state setter
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                             >
                                Cancel
                            </button>
                            <button
                                type="submit" // Submit triggers handleEditForm
                                className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Reports Modal - Controlled by isPopUpForReportsClicked */}
        {isPopUpForReportsClicked && formThatWantToPrintReport && ( //
             // Styled Modal Wrapper
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setIsPopUpForReportsClicked(false)} // Use original state setter
            >
                {/* Styled Modal Content Box */}
                <div
                    className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()} //
                >
                     {/* Use original state variable in title */}
                     <h2 className="mb-4 text-xl font-semibold text-gray-800">Reports for: {formThatWantToPrintReport.title}</h2>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                         {/* Styled Report Buttons using original handlers */}
                        <button onClick={getAllCoursePriorityLists} className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"> {/* Use original handler */}
                            All Courses Priority
                        </button>
                        <button onClick={() => setIsPopUpForSpecificCourseClicked(true)} className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"> {/* Use original state setter */}
                            Specific Course Priority
                        </button>
                         <button onClick={getFormCourseStats} className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"> {/* Use original handler */}
                            Courses Stats
                        </button>
                        <button onClick={getGraduatingStudentCourses} className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"> {/* Use original handler */}
                            Graduating Students
                        </button>

                        {/* Styled AI Button using primary color */}
                        <button onClick={() => setIsPopUpForAiClicked(true)} className="sm:col-span-2 inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"> {/* Use original state setter */}
                            Generate Section Schedule (AI)
                        </button>
                    </div>
                     {/* Styled Cancel Button */}
                    <div className="mt-6 flex justify-end">
                         <button type="button" onClick={() => setIsPopUpForReportsClicked(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"> {/* Use original state setter */}
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

         {/* Specific Course Selection Modal - Controlled by isPopUpForSpecificCourseClicked */}
         {isPopUpForSpecificCourseClicked && formThatWantToPrintReport && ( //
             // Styled Modal Wrapper
             <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setIsPopUpForSpecificCourseClicked(false)} // Use original state setter
             >
                 {/* Styled Modal Content Box */}
                 <div
                    className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()} //
                >
                    <h2 className="mb-4 text-xl font-semibold text-gray-800">Select Course for Report</h2>

                    {/* Styled List Container */}
                     <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
                         {/* Use original function getAllCoursesInPlan */}
                        {getAllCoursesInPlan(formThatWantToPrintReport).length > 0 ? ( //
                            getAllCoursesInPlan(formThatWantToPrintReport).map((courseCode) => ( //
                            // Styled Button for each course
                            <button
                                key={courseCode} //
                                onClick={() => { //
                                    setSpecificCourse(courseCode) // Use original state setter
                                    getCoursePriorityList() // Use original handler
                                }}
                                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {courseCode}
                            </button>
                            ))
                        ) : (
                             <p className="text-center text-sm text-gray-500">No courses found for this form's plan.</p>
                        )}
                    </div>
                     {/* Styled Cancel Button */}
                    <div className="mt-6 flex justify-end">
                         <button type="button" onClick={() => setIsPopUpForSpecificCourseClicked(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"> {/* Use original state setter */}
                            Cancel
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* AI Options Modal - Controlled by isPopUpForAiClicked */}
        {isPopUpForAiClicked && formThatWantToPrintReport && ( //
            // Styled Modal Wrapper
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setIsPopUpForAiClicked(false)} // Use original state setter
            >
                {/* Styled Modal Content Box */}
                <div
                    className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()} //
                >
                     <h2 className="mb-4 text-xl font-semibold text-gray-800">AI Schedule Generation Options</h2>

                    {/* Styled Input using original state */}
                    <div className="mb-4">
                        <label htmlFor="sectionCapacityAi" className="mb-1 block text-sm font-medium text-gray-700">Section Capacity (Optional)</label>
                        <input
                            type="number"
                            id="sectionCapacityAi" // Use unique ID if needed
                            value={sectionCapacity} // Original state
                            onChange={(e) => { // Original logic
                                if(e.target.value >= 1 || e.target.value === "") //
                                setSectionCapacity(e.target.value)} // Original setter
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="Default capacity if empty"
                            min="1"
                        />
                    </div>

                    {/* Styled Time Preference Buttons using original state */}
                    <div className="mb-4">
                         <label className="mb-1 block text-sm font-medium text-gray-700">Time Preference (Optional)</label>
                         <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {/* Buttons styled to show selection state */}
                            <button
                                type="button"
                                onClick={() => setTimePreference("MorningAndAfternoonFocus")} // Original setter
                                className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${timePreference === "MorningAndAfternoonFocus" ? 'border-transparent bg-accent text-white ring-accent' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ring-secondary'}`}
                            >
                                 Morning & Afternoon
                            </button>
                             <button
                                type="button"
                                onClick={() => setTimePreference("AfternoonAndEveningFocus")} // Original setter
                                className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${timePreference === "AfternoonAndEveningFocus" ? 'border-transparent bg-accent text-white ring-accent' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ring-secondary'}`}
                            >
                                Afternoon & Evening
                            </button>
                         </div>
                         {/* Button to clear selection */}
                          {timePreference && ( //
                            <button onClick={() => setTimePreference("")} className="mt-2 text-xs text-accent hover:underline">Clear preference</button> // Original setter
                          )}
                    </div>

                     {/* Styled Action Buttons */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setIsPopUpForAiClicked(false)} // Use original state setter
                            className="order-last w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 sm:order-first sm:w-auto"
                         >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={generateSectionSchedule} // Use original handler
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
                        >
                            Generate Schedule
                        </button>
                    </div>
                </div>
            </div>
         )}

    </>
  );
};

export default AdminHomePage;