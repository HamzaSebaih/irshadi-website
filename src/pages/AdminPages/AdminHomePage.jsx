import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {useNavigate } from 'react-router';

const AdminHomePage = () => {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const [updateTheTable, setUpdateTheTable] = useState(true) 
  const [formsTable, setFormTable] = useState([]) 
  const [formThatWantToBeDeleted, setFormThatWantToBeDeleted] = useState(null) 
  const [deleteConfirmPopUp, setDeleteConfirmPopUp] = useState(false) 
  const [isPopUpForAddingClicked, setIsPopUpForAddingClicked] = useState(false) 
  const [isLoading, setIsLoading] = useState(true) 
  const [plans, setPlans] = useState([]) 
  const [newFormName, setNewFormName] = useState("") 
  const [newFormDescription, setNewFormDescription] = useState(''); 
  const [newFormStartDate, setNewFormStartDate] = useState(''); 
  const [newFormEndDate, setNewFormEndDate] = useState(''); 
  const [newFormPlan, setNewFormPlan] = useState(''); 
  const [newFormMaxHours, setNewFormMaxHours] = useState(''); 
  const [newFormMaxGraduateHours, setNewFormMaxGraduateHours] = useState(''); 
  const [newFormExpectedStudents, setNewFormExpectedStudents] = useState(''); 
  const [isPopUpForEditingClicked, setIsPopUpForEditingClicked] = useState(false) 
  const [isPopUpForReportsClicked, setIsPopUpForReportsClicked] = useState(false) 
  const [formThatWantToBeEdited, setFormThatWantToBeEdited] = useState(null) 
  const [formThatWantToPrintReport, setFormThatWantToPrintReport] = useState(null) 
  const [isPopUpForAiClicked, setIsPopUpForAiClicked] = useState(false) 
  const [sectionCapacity, setSectionCapacity] = useState("") 
  const [timePreference, setTimePreference] = useState("") 
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
  const navigate = useNavigate();

  useEffect(() => { //we fetch forms and plans from the backend
    if (!user) return; //we fetch plans to make it selectable when creating a new form
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
    setDeleteConfirmPopUp(true) //show pop up before deleting a form
  };
  const handleDeleteConfirmed = async () => { //after the user click confirm then delete the form
    try {
      if (formThatWantToBeDeleted) { //first check if there is a value in the want to delete form
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
        setUpdateTheTable(true) //update the page when delete succes
      }
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const formatDate = (inputDateString) => { //format the date to make it better to read
    const date = new Date(inputDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); //this will make it 2 digit always 
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const handleSubmitForm = (e) => { //form submiting
    e.preventDefault(); //stop the browser its default action to handle it manauly
    if (newFormStartDate && newFormEndDate) {
      const start = new Date(newFormStartDate);
      const end = new Date(newFormEndDate);

      if (end < start) { //form checking for date
        alert('Please make sure the Start is before The End Date');
      } else {
        handleAddNewForm().finally(() => { //create a new form and in the end empty all values
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

  const handleAddNewForm = async () => { //here when we are sending the request to the backend
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
    //here I'm creating a new value of date to check for endDateValue < startDateValue
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
          start_date: formatDate(formThatWantToBeEdited.start_date),
          end_date: formatDate(formThatWantToBeEdited.end_date),
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

//below is 4 functions to create reports each with a unique response so I take the response and handle it in showReport page
  const getAllCoursePriorityLists = async () => { //Report No.1
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
        if (response.status === 409) {
          throw new Error("Missing or invalid form")
        }
        else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      const data = await response.json();
      navigate('/ShowReport', { state: {reportJson: data ,typeOfReport:1} }); //typeOfReport stand for this report type
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports (All Courses):", error);
      alert(error)
    }
  }

  const getFormCourseStats = async () => {//Report No.2
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
        if (response.status === 409) {
          throw new Error("Missing or invalid form")
        }
        else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      const data = await response.json();
      navigate('/ShowReport', { state: {reportJson: data ,typeOfReport:2} }); //typeOfReport stand for this report type
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports (Course Stats):", error);
      alert(error)
    }
  }

  const getGraduatingStudentCourses = async () => {//Report No.3
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/getGraduatingStudents`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Missing or invalid form")
        }
        else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      const data = await response.json();
      navigate('/ShowReport', { state: {reportJson: data ,typeOfReport:3} }); //typeOfReport stand for this report type
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports (Graduating Students):", error);
      alert(error)
    }
  }

  const generateSectionSchedule = async () => {//Report No.4
    if (!formThatWantToPrintReport) {
      alert("Error: No form selected for AI schedule generation.");
      return;
    }
    try {
      setIsLoading(true)
      let body = {}
      if (sectionCapacity != "" && timePreference != "") {
        body = {
          form_id: formThatWantToPrintReport.form_id,
          section_capacity: Number(sectionCapacity),
          time_preference: timePreference
        }
      } else if (sectionCapacity != "") {
        body = {
          form_id: formThatWantToPrintReport.form_id,
          section_capacity: Number(sectionCapacity),
        }
      } else if (timePreference != "") {
        body = {
          form_id: formThatWantToPrintReport.form_id,
          time_preference: timePreference
        }
      } else {
        body = {
          form_id: formThatWantToPrintReport.form_id,
        }
      }
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
        if (response.status === 409) {
          throw new Error("Missing or invalid form")
        }
        else {
          throw new Error(`Error Generating Schedule ${response.status}`);
        }

      }
      const data = await response.json();
      navigate('/ShowReport', { state: {reportJson: data ,typeOfReport:4} }); //typeOfReport stand for this report type
      setIsPopUpForAiClicked(false)
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error generating AI Schedule:", error);
      alert(error)
    }
    finally {
      setIsLoading(false)
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
      {/* page Layout */}
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-7xl">
          {/* header */}
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h1 className="text-2xl font-semibold text-gray-900">Manage Forms</h1>
            {/* add Button */}
            <button
              onClick={() => setIsPopUpForAddingClicked(true)} 
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Create New Form
            </button>
          </div>

          {/* check if no forms or show forms if available */}
          {formsTable.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {formsTable.map((form) => { //
                // calculate completion percentage
                const completion = form.expected_students > 0 
                  ? Math.round((form.responses / form.expected_students) * 100) 
                  : 0; 
                const clampedCompletion = Math.min(completion, 100); //don't excced the 100 using Math.min

                return (
                  // form cards
                  <div key={form.form_id} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                    {/* card header */}
                    <div className="p-4">
                      <h2 className="truncate text-lg font-semibold text-gray-900" title={form.title}>{form.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600" title={form.description}>{form.description || 'No description'}</p>
                    </div>

                    {/* card body */}
                    <div className="flex-grow p-4">
                      {/* dates */}
                      <div className="mb-3 space-y-1 text-sm text-gray-500">
                        <div><strong>Start:</strong> {formatDate(form.start_date)}</div>
                        <div><strong>End:</strong> {formatDate(form.end_date)}</div>
                      </div>

                      {/* current stats */}
                      <div className="mb-3 space-y-1 text-sm text-gray-500">
                        <div><strong>Responses:</strong> {form.responses ?? 'N/A'}</div>
                        <div><strong>Expected:</strong> {form.expected_students ?? 'N/A'}</div>
                      </div>

                      {/* progress bar */}
                      {form.expected_students > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Completion</span>
                            <span>{clampedCompletion}%</span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${clampedCompletion}%` }} 
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex border-t border-gray-200 bg-gray-50">
                      <button
                        title="Delete Form"
                        className="flex-1 border-r border-gray-200 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-danger"
                        onClick={() => { 
                          setFormThatWantToBeDeleted(form.form_id); 
                          onDelete();
                        }}
                      >
                        Delete
                      </button>
                      
                       <button
                        title="Edit Form"
                        className="flex-1 border-r border-gray-200 px-4 py-3 text-sm font-medium text-accent-dark hover:bg-accent/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-accent"
                        onClick={() => { 
                          setFormThatWantToBeEdited(form); 
                          setIsPopUpForEditingClicked(true); 
                        }}
                      >
                        Edit
                      </button>
                      <button
                        title="View Reports"
                        className="flex-1 px-4 py-3 text-sm font-medium text-primary-dark hover:bg-primary/10 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={() => { 
                          setFormThatWantToPrintReport(form); 
                          setIsPopUpForReportsClicked(true); 
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

            // here we will show the empty state -----------------------------------------------------------------------
            <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new form.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsPopUpForAddingClicked(true)}
                  className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Create New Form
                </button>
              </div>
            </div>
          )}
        </div>  
      </div>

      {/* this is the popup section --------------------------------------------------------------------------------------------------------- */}
      {/* add Form popup */}
      {isPopUpForAddingClicked && ( 
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPopUpForAddingClicked(false)} 
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Create a new Form</h2>
            <form onSubmit={handleSubmitForm}> {/* when the user submit the form trigger handleSubmitForm function */}
              <div className="mb-4">
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Form Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="title" 
                  value={newFormName} 
                  onChange={(e) => setNewFormName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter Form Name"
                  required 
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Description <span className="text-danger">*</span></label>
                <textarea
                  id="description" 
                  value={newFormDescription} 
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter description"
                  required 
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-gray-700">Start Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    id="start_date" 
                    value={newFormStartDate} 
                    onChange={(e) => setNewFormStartDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="mb-1 block text-sm font-medium text-gray-700">End Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    id="end_date" 
                    value={newFormEndDate} 
                    onChange={(e) => setNewFormEndDate(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required 
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="plan" className="mb-1 block text-sm font-medium text-gray-700">Plan <span className="text-danger">*</span></label>
                <select
                  id="plan" 
                  value={newFormPlan}
                  onChange={(e) => setNewFormPlan(e.target.value)} 
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required 
                >
                  <option value="" disabled>Select a plan</option> {/* that's the reason why we fetch plans with forms in this page even if its main purpose is to show forms */}
                  {plans.map((plan) => ( 
                    <option key={plan.plan_id} value={plan.plan_id}> 
                      {plan.plan_id} 
                    </option> 
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="max_hours" className="mb-1 block text-sm font-medium text-gray-700">Max Hours <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    id="max_hours" 
                    value={newFormMaxHours} 
                    onChange={(e) => setNewFormMaxHours(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="e.g., 18"
                    min="1" 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="max_graduate_hours" className="mb-1 block text-sm font-medium text-gray-700">Max Graduate Hours <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    id="max_graduate_hours" 
                    value={newFormMaxGraduateHours} 
                    onChange={(e) => setNewFormMaxGraduateHours(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="e.g., 21"
                    min={newFormMaxHours || "1"}
                    required 
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="expected_students" className="mb-1 block text-sm font-medium text-gray-700">Expected Students <span className="text-danger">*</span></label>
                <input
                  type="number"
                  id="expected_students" 
                  value={newFormExpectedStudents} 
                  onChange={(e) => setNewFormExpectedStudents(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="e.g., 500"
                  min="1"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPopUpForAddingClicked(false)} // when cancel is clicked then remove the popup
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit" // this button will trigger the handleSubmitForm
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Add Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* delete confirmation popup */}
      {deleteConfirmPopUp && ( 
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => { 
            setFormThatWantToBeDeleted(null);
            setDeleteConfirmPopUp(false); //close the popup if clicked outside
          }}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} 
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete this Form? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                onClick={() => { 
                  setFormThatWantToBeDeleted(null); 
                  setDeleteConfirmPopUp(false); 
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger-dark focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                onClick={() => { 
                  handleDeleteConfirmed() 
                  setFormThatWantToBeDeleted(null); 
                  setDeleteConfirmPopUp(false); 
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* edit form popup */}
      {isPopUpForEditingClicked && formThatWantToBeEdited && ( //we will modify the form in formThatWantToBeEdited object then send the changes to the backend
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPopUpForEditingClicked(false)} 
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} 
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Edit Form</h2>


            <form onSubmit={handleEditForm}> {/* when submited it will trigger handleEditForm */}
              <div className="mb-4">
                <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  id="title" 
                  value={formThatWantToBeEdited.title} 
                  onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ 
                    ...prevForm, 
                    title: e.target.value, 
                  }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter plan title"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Description <span className="text-danger">*</span></label>
                <textarea
                  id="description" 
                  value={formThatWantToBeEdited.description} 
                  onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ 
                    ...prevForm, 
                    description: e.target.value, 
                  }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter description"
                  required 
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-gray-700">Start Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    id="start_date" 
                    value={formatDate(formThatWantToBeEdited.start_date)} 
                    onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ 
                      ...prevForm, 
                      start_date: e.target.value,
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="mb-1 block text-sm font-medium text-gray-700">End Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    id="end_date" 
                    value={formatDate(formThatWantToBeEdited.end_date)} 
                    onChange={(e) => setFormThatWantToBeEdited(prevForm => ({ 
                      ...prevForm, 
                      end_date: e.target.value, 
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required 
                  />
                </div>
              </div>

              {/* non editable fields */}
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                <p className="text-gray-600"><strong>Plan ID:</strong> {formThatWantToBeEdited.plan_id}</p>
                <p className="text-gray-600"><strong>Max Hours:</strong> {formThatWantToBeEdited.max_hours}</p>
                <p className="text-gray-600"><strong>Max Graduate Hours:</strong> {formThatWantToBeEdited.max_graduate_hours}</p>
                <p className="text-gray-600"><strong>Expected Students:</strong> {formThatWantToBeEdited.expected_students}</p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPopUpForEditingClicked(false)} 
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit" // submit will triggers handleEditForm
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* print reports popup */}
      {isPopUpForReportsClicked && formThatWantToPrintReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPopUpForReportsClicked(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Reports for: {formThatWantToPrintReport.title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* Report No.1 */}
              <button onClick={getAllCoursePriorityLists} className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
                Courses Priority
              </button>

              {/* Report No.2 */}
              <button onClick={getFormCourseStats} className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
                Courses Stats
              </button>

              {/* Report No.3 */}
              <button onClick={getGraduatingStudentCourses} className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
                Graduating Students
              </button>

              {/* Report No.4 */}
              <button onClick={() => { //in this report I will show other popup to select some options  
              setIsPopUpForAiClicked(true) }
              } className="inline-flex justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
                Schedule (AI)
              </button>
            </div>

            <div className="mt-6 flex justify-center">
              <button type="button" onClick={() => setIsPopUpForReportsClicked(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI scheduling options popup */}
      {isPopUpForAiClicked && formThatWantToPrintReport && ( 
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPopUpForAiClicked(false)} 
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} 
          >
            <h2 className="mb-4 text-xl font-semibold text-gray-800">AI Schedule Generation Options</h2>

            <div className="mb-4">
              <label htmlFor="sectionCapacityAi" className="mb-1 block text-sm font-medium text-gray-700">Section Capacity (Optional)</label>
              <input
                type="number"
                id="sectionCapacityAi" 
                value={sectionCapacity} 
                onChange={(e) => { 
                  if (e.target.value >= 1 || e.target.value === "") 
                    setSectionCapacity(e.target.value)
                }
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Default value 25 "
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Time Preference (Optional)</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTimePreference("MorningAndAfternoonFocus")}
                  className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${timePreference === "MorningAndAfternoonFocus" ? 'border-transparent bg-accent text-white ring-accent' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ring-secondary'}`}
                >
                  Morning & Afternoon
                </button>
                <button
                  type="button"
                  onClick={() => setTimePreference("AfternoonAndEveningFocus")} 
                  className={`inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${timePreference === "AfternoonAndEveningFocus" ? 'border-transparent bg-accent text-white ring-accent' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ring-secondary'}`}
                >
                  Afternoon & Evening
                </button>
              </div>
              {/* button to clear selection */}
              {timePreference && ( //
                <button onClick={() => setTimePreference("")} className="mt-2 text-xs text-accent hover:underline">Clear preference</button> 
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsPopUpForAiClicked(false)}
                className="order-last w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 sm:order-first sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateSectionSchedule}
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