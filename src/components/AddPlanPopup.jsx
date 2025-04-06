import { useState } from 'react';

const AddPlanPopup = ({ onClose, onPlanAdded }) => {
  // State to hold the plan name and number of levels
  const [planName, setPlanName] = useState('');
  const [numLevels, setNumLevels] = useState('');

  // Function to handle form submission and send the fetch request
  const handleAdding = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: planName,
          levels: Number(numLevels), // Convert numLevels to a number
        }),
      });
      if (response.ok) {
        // If the request is successful, trigger the onPlanAdded callback and close the pop-up
        onPlanAdded();
        onClose();
      } else {
        console.error('Failed to add plan');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2>Add New Plan</h2>
        <form onSubmit={handleAdding}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Plan Name:
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter plan name"
                style={{ marginLeft: '10px', padding: '5px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Number of Levels:
              <input
                type="number"
                value={numLevels}
                onChange={(e) => setNumLevels(e.target.value)}
                placeholder="Enter number of levels"
                style={{ marginLeft: '10px', padding: '5px' }}
              />
            </label>
          </div>
          <div>
            <button type="submit" style={{ marginRight: '10px', padding: '5px 10px' }}>
              Add Plan
            </button>
            <button onClick={onClose} style={{ padding: '5px 10px' }}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlanPopup;