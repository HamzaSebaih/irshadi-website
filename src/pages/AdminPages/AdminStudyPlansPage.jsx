import React from 'react';

const AdminStudyPlansPage = () => {
  const plans = [
    { id: 1, title: 'IT', updated: 'Last updated 2 days ago' },
    { id: 2, title: 'CS', updated: 'Last updated 1 week ago' },
    { id: 3, title: 'IS', updated: 'Last updated 3 days ago' },
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-fadeIn w-full max-w-xs"
            >
              <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">
                {plan.title}
              </h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">{plan.updated}</p>
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold animate-badgePop">
                  q/11
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminStudyPlansPage;