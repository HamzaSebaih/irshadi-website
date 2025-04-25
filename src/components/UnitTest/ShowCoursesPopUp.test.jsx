/*


This file contains 3 test that fill under Integration test 


*/

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ShowCoursesPopUp from '../ShowCoursesPopUp';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

global.fetch = jest.fn();

describe('ShowCoursesPopUp Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the user object with getIdToken method
    useAuth.mockReturnValue({ 
      user: { 
        getIdToken: jest.fn().mockResolvedValue('test-token') 
      } 
    });
  });
  
  describe('API Interaction Tests', () => {
    // First Test
    it('should fetch courses on component mount', async () => {
      const mockCourses = [
        { department: 'CPIT', course_number: 250, course_name: 'Test Course', hours: 3 }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: mockCourses })
      });

      render(<ShowCoursesPopUp />);
      
      // Wait for the fetch call to be made
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:5000/getCourses',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              Authorization: 'test-token'
            })
          })
        );
      });
    });
    // Second Test
    it('should handle course creation successfully', async () => {
      // Setup mock responses for all expected fetch calls
      fetch.mockImplementation((url) => {
        // First call for getCourses
        if (url === 'http://127.0.0.1:5000/getCourses') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ courses: [] })
          });
        }
        // Second call for addCourse
        if (url === 'http://127.0.0.1:5000/addCourse') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
          });
        }
        return Promise.reject(new Error('Unhandled fetch call'));
      });

      render(<ShowCoursesPopUp />);
      
      // Explicitly wait for the loading state to finish and the "Create New Course" button to appear
      await waitFor(() => {
        expect(screen.getByText('Create New Course')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Now we can interact with the button
      fireEvent.click(screen.getByText('Create New Course'));
      
      // Wait for the form to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('Ex. CPIT'), { 
        target: { value: 'CPIT' }
      });
      fireEvent.change(screen.getByPlaceholderText('Ex. 250'), { 
        target: { value: '250' }
      });
      fireEvent.change(screen.getByPlaceholderText('Ex. 3'), { 
        target: { value: '3' }
      });
      fireEvent.change(screen.getByPlaceholderText('Ex. Software Engineering 1'), { 
        target: { value: 'Test Course' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByText('Save Course'));
      
      // Verify the API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://127.0.0.1:5000/addCourse',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              department: 'CPIT',
              course_number: 250,
              course_name: 'Test Course',
              hours: 3
            })
          })
        );
      });
    });
    // Third test
    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));
      render(<ShowCoursesPopUp />);
      
      // Wait for loading to finish
      await waitFor(() => {
        // Check that "Available Courses" is visible, which indicates loading is done
        expect(screen.getByText('Available Courses')).toBeInTheDocument();
      });
      
      // Verify empty state - no list items should be present
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });
});