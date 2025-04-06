import { useLocation } from 'react-router-dom';

const PlanDetailsPage = () => {
    const location = useLocation();
        const planData={
        "plan_id": location.state.plan.plan_id,
        "levels": {
          "Level 1": [
            { "courseCode": "CPIT101", "prerequisite": "None" },
            { "courseCode": "CPIT102", "prerequisite": "CPIT101" }
          ],
          "Level 2": [
            { "courseCode": "CPIT201", "prerequisite": "None" },
            { "courseCode": "CPIT202", "prerequisite": "CPIT201" }
          ],
          "Extra": [
            { "courseCode": "CPIT999", "prerequisite": "None" }
          ]
        }
      }


  // Access planData from route state
//   const planData = location.state?.plan;

  // Handle case where planData is not available
  if (!planData) {
    return <div className="text-center text-gray-500 py-8">No plan data received.</div>;
  }

  // Function to sort level keys: numbered levels first, then others (e.g., "Extra")
  const getSortedLevelKeys = (levels) => {
    const levelKeys = Object.keys(levels);
    const numberedLevels = levelKeys
      .filter(key => key.startsWith("Level"))
      .sort((a, b) => {
        const numA = parseInt(a.split(' ')[1]);
        const numB = parseInt(b.split(' ')[1]);
        return numA - numB;
      });
    const extraLevels = levelKeys.filter(key => !key.startsWith("Level"));
    return [...numberedLevels, ...extraLevels];
  };

  // Get sorted level keys
  const sortedLevelKeys = getSortedLevelKeys(planData.levels);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Plan Name Header */}
      <div className="bg-blue-600 text-white p-4 rounded-md mb-6">
        <h1 className="text-2xl font-bold">{planData.plan_id}</h1>
      </div>

      {/* Levels Container */}
      <div className="space-y-8">
        {sortedLevelKeys.map(levelKey => (
          <div key={levelKey} className="border border-gray-200 p-4 rounded-lg shadow-sm">
            {/* Level Name */}
            <h2 className="text-xl font-semibold mb-4">{levelKey}</h2>
            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {planData.levels[levelKey].map((course, index) => (
                <div key={index} className="border border-gray-300 p-3 rounded flex flex-col">
                  <span className="font-bold text-gray-800">{course.courseCode}</span>
                  <span className="text-gray-600 mt-1">
                    Prerequisite: {course.prerequisite}
                    {course.prerequisite === "None" && (
                      <button className="ml-2 text-blue-500 underline hover:text-blue-700">
                        select prerequisite
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Button */}
      <button className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 mt-8 block mx-auto">
        Confirm
      </button>
    </div>
  );
};

export default PlanDetailsPage;
