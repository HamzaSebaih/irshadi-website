import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from 'react-router';


const AvailableForms = () => {
    const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
    const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
    const [forms,setForms]= useState([])
    const [isLoading,setIsLoading] = useState(true)

    useEffect(() => { // this block of code will work only when entering the page
        //it will load all the avalable forms from the backend server
        // If there's no authenticated user then clear the extra info.
        if (!user) {
        setIsLoading(false);
        setForms([]);
          return;
        }
        setIsLoading(true)
        const fetchForms = async () => {
          try {
            const token = await user.getIdToken();
            const response = await fetch(`${backendIp}/getMyForms`, {
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
            setForms(data.forms || []) // Ensure forms is array
          } catch (error) {
            console.error("Error fetching forms:", error);
            setForms([]);
          }
          finally {
            setIsLoading(false)
          }
        };

        fetchForms();
      }, [user]);

      if (isLoading) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        );
      }

    return (
         // Consistent Page Layout
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="container mx-auto max-w-4xl"> 
                <h1 className="mb-6 text-2xl font-semibold text-gray-900">Available Forms</h1>
                {forms.length > 0 ? (
                    <div className="space-y-4">
                        {forms.map(form => (
                            // Styled Card for each form
                            <div
                                key={form.form_id || form.id} // Prefer form_id if available
                                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <h2 className="text-lg font-semibold text-accent-dark">{form.title}</h2>
                                <p className="mt-1 text-sm text-gray-500"><strong>Due Date:</strong> {new Date(form.end_date).toLocaleDateString()}</p> {/* Format date */}
                                <p className="mt-2 text-sm text-gray-700"><strong>Description: </strong> {form.description}</p>
                                <p className="mt-1 text-sm text-gray-700"><strong>Section: </strong>{form.plan_id}</p>
                                <hr className="my-4 border-gray-200" /> {/* Consistent divider */}
                                 {/* Styled Link as Primary Button */}
                                <Link
                                    to={`/FillFormPage`} // here I will pass other elements to the FillFormPage (passing the whole form)
                                    state={{ form: form }} // passing the form to the next page
                                    title="Fill Form"
                                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                    Start Form
                                </Link>
                            </div>
                        ))}
                    </div>
                 ) : (
                    // Styled Empty State
                    <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No forms available</h3>
                        <p className="mt-1 text-sm text-gray-500">There are currently no forms assigned to you.</p>
                        <p className="mt-1 text-sm text-gray-500">Try updating your information.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AvailableForms;