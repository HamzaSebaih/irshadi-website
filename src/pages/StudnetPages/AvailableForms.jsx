const forms = [ //this is an example of how the data will look like if we took it from the backend ! @AbdulazizJastanieh @WaleedAlsafari
    {
        id: 1,
        title: "Early registration summer 2025",
        dueDate: "2025/1/29",
        description: "This form is used to know the most wanted courses during summer of 2025"
    },
    {
        id: 2,
        title: "Feedback Form Spring 2025",
        dueDate: "2025/3/15",
        description: "This form collects feedback for the spring semester courses."
    }
];

const AvailableForms = () => {
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Available Forms</h1>
            <div className="space-y-4">
                {forms.map(form => (
                    <div 
                        key={form.id} 
                        className="bg-white shadow-md rounded-lg p-5 border border-gray-300"
                    >
                        <h2 className="text-xl font-semibold text-gray-800">{form.title}</h2>
                        <p className="text-gray-600 mt-2"><strong>Due Date:</strong> {form.dueDate}</p>
                        <p className="text-gray-700">{form.description}</p>
                        <hr className="my-3 border-gray-200" />
                        <button className="mt-4 bg-blue-600 text-white py-3 px-16 rounded hover:bg-blue-700 transition">
                            Start
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvailableForms;
