import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

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
  const [isPopUpForSpecificCourseClicked, setIsPopUpForSpecificCourseClicked] = useState(false)
  const [isPopUpForAiClicked, setIsPopUpForAiClicked] = useState(false)
  const [specificCourse, setSpecificCourse] = useState(null)
  const [sectionCapacity,setSectionCapacity] = useState("")
  const [timePreference,setTimePreference] = useState("")
  const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
  useEffect(() => {
    if (!user) return;
    setIsLoading(true); // Start loading
    fetchForms().finally(() => setIsLoading(false)); // Set loading to false when fetch completes
    fetchPlans() //we load it so it can be selected when adding a new form 
    setUpdateTheTable(false);
  }, [updateTheTable, user]);

  // Function to fetch courses from the backend
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

  const onDelete = () => { //this will handle the delete button
    setDeleteConfirmPopUp(true)
  };
  const handleDeleteConfirmed = async () => { //this will send the plan details to the backend
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
        setUpdateTheTable(true) //fetch data again
      }
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };
  const formatDate = (inputDateString) => {
    const date = new Date(inputDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  const handleSubmitForm = () => {
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
        });

      }
    }


  }

  const handleAddNewForm = async () => { //this will send the form details to the backend
    try {
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
          "Authorization": `${user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };
  const handleEditForm = async () => {
    console.log(formThatWantToBeEdited)
    const start = new Date(formatDate(formThatWantToBeEdited.start_date));
    const end = new Date(formatDate(formThatWantToBeEdited.end_date));

    if (end < start) {
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
        setUpdateTheTable(true)
        setIsPopUpForEditingClicked(false)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

      } catch (error) {
        console.error("Error adding plan:", error);
      }
    }
  };

  const getAllCoursesInPlan = (formData) => { //this function will return all courses so I can show it when I want to print report for one course only
    const plan_id = formData.plan_id;
    const plan = plans.find(p => p.plan_id === plan_id);
    if (plan) {
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
          body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id }),
        },
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
      console.log(data)
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports", error);
      alert(error)
    }

  }
  const getCoursePriorityList = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/getCoursePriorityList`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
          body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id, course_id: specificCourse }),
        },
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
      console.log(data)
      setIsPopUpForSpecificCourseClicked(false)
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports", error);
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
          body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id }),
        },
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
      console.log(data)
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports", error);
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
          body: JSON.stringify({ form_id: formThatWantToPrintReport.form_id }),
        },
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
      console.log(data)
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports", error);
      alert(error)
    }
  }

  const generateSectionSchedule = async () => {
    try {
      let body ={}
      if(sectionCapacity!="" && timePreference != ""){
         body = {
          form_id: formThatWantToPrintReport.form_id,
          sectionCapacity:sectionCapacity,
          timePreference:timePreference
        }
      } else if(sectionCapacity != ""){
         body = {
          form_id: formThatWantToPrintReport.form_id,
          sectionCapacity:sectionCapacity,
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
      console.log(body)
      setIsPopUpForAiClicked(false)
      setIsPopUpForReportsClicked(false)
      const token = await user.getIdToken();
      const response = await fetch(`${backendIp}/generateSectionSchedule`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
          body: JSON.stringify({ ...body }),
        },
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
      console.log(data)
      setIsPopUpForReportsClicked(false)
    } catch (error) {
      console.error("Error in Reports", error);
      alert(error)
    }
    finally{
      setTimePreference("")
      setSectionCapacity("")
    }
  }


  return (
    <>
      {!isLoading ? (
        <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
          <div className="mx-auto max-w-7xl w-full">
            <div
              className={`grid ${formsTable.length === 0
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                } gap-6 justify-items-center`}
            >

              {formsTable.map((form, index) => (

                <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  {/* Title */}
                  <h2 className="text-xl font-semibold">{form.title}</h2>

                  {/* Description */}
                  <p className="mt-2 text-gray-600">{form.description}</p>

                  {/* Dates */}
                  <div className="mt-4 flex flex-col space-y-1 text-sm text-gray-500">
                    <span><strong>Start:</strong> {formatDate(form.start_date)}</span>
                    <span><strong>End:</strong> {formatDate(form.end_date)}</span>
                  </div>

                  {/* Responses and Expected Students */}
                  <div className="mt-2 flex flex-col space-y-1 text-sm text-gray-500">
                    <span><strong>Responses:</strong> {form.responses}</span>
                    <span><strong>Expected Students:</strong> {form.expected_students}</span>
                  </div>
                  {/* Progress Bar */}
                  {form.expected_students > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        Completion: {Math.round((form.responses / form.expected_students) * 100)}%
                      </p>
                      <div className="w-full h-4 bg-gray-200 rounded-full mt-1">
                        <div
                          className="h-4 bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((form.responses / form.expected_students) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex space-x-4">
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition w-full h-full"
                      onClick={() => {
                        setFormThatWantToBeDeleted(form.form_id);
                        onDelete();
                      }}
                    >
                      Delete
                    </button>

                    <button
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition w-full h-full"
                      onClick={() => {
                        setFormThatWantToBeEdited(form);
                        setIsPopUpForEditingClicked(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition w-full h-full"
                      onClick={() => {
                        setFormThatWantToPrintReport(form);
                        setIsPopUpForReportsClicked(true);
                      }}
                    >
                      Reports
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-fadeIn w-full max-w-xs flex flex-col justify-center items-center min-h-[200px]">

                {formsTable.length === 0 && (
                  <p className="text-center text-gray-600 mb-4">
                    No Forms available. Click below to create a new Form.
                  </p>
                )}

                <div className="flex justify-center">
                  <button
                    className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold hover:bg-blue-700 transition-colors"
                    onClick={() => setIsPopUpForAddingClicked(true)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-screen">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      )
      }

      {isPopUpForAddingClicked && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setIsPopUpForAddingClicked(false)} // Close on overlay click
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-96"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
          >
            <form onSubmit={handleSubmitForm}>
              <h2 className="text-xl font-bold mb-4">Create a new Form</h2>

              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 mb-2">Form Name</label>
                <input
                  type="text"
                  id="title"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter Form Name"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 mb-2">Description</label>
                <textarea
                  id="description"
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter description"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="start_date" className="block text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  value={newFormStartDate}
                  onChange={(e) => setNewFormStartDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="end_date" className="block text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  id="end_date"
                  value={newFormEndDate}
                  onChange={(e) => setNewFormEndDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* here I used the old plan page code to fetch data and put the available plans here ! */}
              <div className="mb-4">
                <label htmlFor="plan" className="block text-gray-700 mb-2">Plan</label>
                <select
                  id="plan"
                  value={newFormPlan}
                  onChange={(e) => setNewFormPlan(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="" disabled>
                    Select a plan
                  </option>
                  {plans.map((plan) => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.plan_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="max_hours" className="block text-gray-700 mb-2">Max Hours</label>
                <input
                  type="number"
                  id="max_hours"
                  value={newFormMaxHours}
                  onChange={(e) => setNewFormMaxHours(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter max hours"
                  min="1"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="max_graduate_hours" className="block text-gray-700 mb-2">Max Graduate Hours</label>
                <input
                  type="number"
                  id="max_graduate_hours"
                  value={newFormMaxGraduateHours}
                  onChange={(e) => setNewFormMaxGraduateHours(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter max graduate hours"
                  min={newFormMaxHours}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="expected_students" className="block text-gray-700 mb-2">Expected Students</label>
                <input
                  type="number"
                  id="expected_students"
                  value={newFormExpectedStudents}
                  onChange={(e) => setNewFormExpectedStudents(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter expected students"
                  min="1"
                  required
                />
              </div>


              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPopUpForAddingClicked(false)}
                  className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmPopUp && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={() => {
            setFormThatWantToBeDeleted(null);
            setDeleteConfirmPopUp(false);
          }}
        >
          <div
            className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-700 mb-8 text-2xl">
              Are you sure you want to delete this Form ?
            </p>
            <div className="flex justify-end space-x-4 relative">
              <button
                className="absolute left-0 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                onClick={() => {
                  setFormThatWantToBeDeleted(null);
                  setDeleteConfirmPopUp(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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

      {isPopUpForEditingClicked && (

        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setIsPopUpForEditingClicked(false)} // if user clicks outside, it will exit
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-96"
            onClick={(e) => e.stopPropagation()} // prevents the button from triggering click event on parent elements
          >
            <h2 className="text-xl font-bold mb-4">Edit Form</h2>

            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                id="title"
                value={formThatWantToBeEdited.title}
                onChange={(e) => setFormThatWantToBeEdited(prevForm => ({
                  ...prevForm, // keep the existing properties
                  title: e.target.value,
                }))}
                className="w-full p-2 border rounded"
                placeholder="Enter plan title"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                value={formThatWantToBeEdited.description}
                onChange={(e) => setFormThatWantToBeEdited(prevForm => ({
                  ...prevForm, // keep the existing properties
                  description: e.target.value,
                }))}
                className="w-full p-2 border rounded"
                placeholder="Enter description"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="start_date" className="block text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                id="start_date"
                value={formatDate(formThatWantToBeEdited.start_date)}
                onChange={(e) => setFormThatWantToBeEdited(prevForm => ({
                  ...prevForm, // keep the existing properties
                  start_date: e.target.value,
                }))}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="end_date" className="block text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                id="end_date"
                value={formatDate(formThatWantToBeEdited.end_date)}
                onChange={(e) => setFormThatWantToBeEdited(prevForm => ({
                  ...prevForm, // keep the existing properties
                  end_date: e.target.value,
                }))}
                className="w-full p-2 border rounded"
                required
              />
            </div>


            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsPopUpForEditingClicked(false)}
                className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleEditForm}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>



      )}
      {isPopUpForReportsClicked && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsPopUpForReportsClicked(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Choose A Report
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-4 py-2 transition"
                onClick={() => getAllCoursePriorityLists()}
              >
                All Courses Priority Lists
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-4 py-2 transition"
                onClick={() => setIsPopUpForSpecificCourseClicked(true)}
              >
                Specific Course Priority List
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-4 py-2 transition"
                onClick={() => getFormCourseStats()}
              >
                Courses Stats
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-4 py-2 transition"
                onClick={() => getGraduatingStudentCourses()}
              >
                Graduating Student Courses
              </button>

              {/* Full‑width on all screens */}
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-4 py-6 w-full sm:col-span-2 transition"
                onClick={() => setIsPopUpForAiClicked(true)}
              >
                Generate Section Schedule Using AI
              </button>
            </div>


            <button
              className="mt-6 w-full text-center bg-gray-300 rounded-lg px-4 py-2 hover:bg-gray-400 transition"
              onClick={() => setIsPopUpForReportsClicked(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isPopUpForSpecificCourseClicked && (

        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsPopUpForSpecificCourseClicked(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-3 text-base font-semibold text-gray-700">Select a Course:</h4>


            <div className="space-y-2">
              {getAllCoursesInPlan(formThatWantToPrintReport).map((courseCode) => (
                <button
                  key={courseCode}
                  onClick={() => {
                    setSpecificCourse(courseCode)
                    getCoursePriorityList()
                  }}
                  className="block w-full cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-900 transition duration-150 ease-in-out hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                >
                  {courseCode}
                </button>
              ))}
            </div>
            <button
              className="mt-6 w-full text-center bg-gray-300 rounded-lg px-4 py-2 hover:bg-gray-400 transition"
              onClick={() => setIsPopUpForSpecificCourseClicked(false)}
            >
              Cancel
            </button>
          </div>
        </div>

      )}
      {isPopUpForAiClicked && (

        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsPopUpForAiClicked(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Section Capacity</label>
              <input
                type="number"
                id="title"
                value={sectionCapacity}
                onChange={(e) => {
                  if(e.target.value>=1 || e.target.value=="")
                  setSectionCapacity(e.target.value)}
                }
                className="w-full p-2 border rounded"
                placeholder="Ex. 25"
                required
              />
            </div>

            <div className="mt-4 flex space-x-4">
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition w-full h-full"
                      
                      onClick={() => {
                        setTimePreference("MorningAndAfternoonFocus")
                      }}
                    >
                      Morning And Afternoon Focus
                    </button>

                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition w-full h-full"
                      onClick={() => {
                        setTimePreference("AfternoonAndEveningFocus")
                      }}
                    >
                      Afternoon And Evening Focus
                    </button>
                  </div>

                  <button
              className="mt-4 w-full text-center bg-blue-500 rounded-lg px-4 py-2 hover:bg-blue-600 transition"
              onClick={() => generateSectionSchedule()}
            >
              Confirm
            </button>
                  
            <button
              className="mt-2 w-full text-center bg-gray-300 rounded-lg px-4 py-2 hover:bg-gray-400 transition"
              onClick={() => setIsPopUpForAiClicked(false)}
            >
              Cancel
            </button>
          </div>
        </div>

      )}



    </>
  );
};

export default AdminHomePage;