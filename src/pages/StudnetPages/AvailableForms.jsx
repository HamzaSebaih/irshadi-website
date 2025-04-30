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
            setForms(data.forms || [])
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
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="container mx-auto max-w-4xl"> 
                <h1 className="mb-6 text-2xl font-semibold text-gray-900">Available Forms</h1>
                {forms.length > 0 ? (
                    <div className="space-y-4">
                        {forms.map(form => (
                            // styled cards for each form
                            <div
                                key={form.form_id || form.id}
                                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <h2 className="text-lg font-semibold text-accent-dark">{form.title}</h2>
                                <p className="mt-1 text-sm text-gray-500"><strong>Due Date:</strong> {new Date(form.end_date).toLocaleDateString()}</p>
                                <p className="mt-2 text-sm text-gray-700"><strong>Description: </strong> {form.description}</p>
                                <p className="mt-1 text-sm text-gray-700"><strong>Section: </strong>{form.plan_id}</p>
                                <hr className="my-4 border-gray-200" />
                                <Link
                                    to={`/FillFormPage`} // here I will pass other elements to the FillFormPage (passing the whole form)
                                    state={{ form: form }} // passing the form to the next page
                                    title="Start Form"
                                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                    Start Form
                                </Link>
                            </div>
                        ))}
                    </div>
                 ) : (
                    //  empty State
                    <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No forms available</h3>
                        <p className="mt-1 text-sm text-gray-500">There are currently no forms assigned to you.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AvailableForms;