import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ShowCoursesPopUp from '../ShowCoursesPopUp';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('ShowCoursesPopUp Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { accessToken: 'test-token' } });
    
    // Set up default mock response for getCourses
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: [] })
    });
  });

  describe('Form Validation Tests', () => {
    it('should only allow numbers in course number input', async () => {
      render(<ShowCoursesPopUp />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();
      });

      // Click create new course button to show form
      await act(async () => {
        fireEvent.click(screen.getByText('Create New Course'));
      });
      
      const courseNumberInput = screen.getByPlaceholderText('Ex. 250');
      
      // Try to enter letters
      await act(async () => {
        fireEvent.change(courseNumberInput, { target: { value: 'abc' } });
      });
      expect(courseNumberInput.value).toBe('');
      
      // Try to enter numbers
      await act(async () => {
        fireEvent.change(courseNumberInput, { target: { value: '123' } });
      });
      expect(courseNumberInput.value).toBe('123');
    });

    it('should only allow hours greater than or equal to 1', async () => {
      render(<ShowCoursesPopUp />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Create New Course'));
      });
      
      const hoursInput = screen.getByPlaceholderText('Ex. 3');
      
      // Try to enter 0
      await act(async () => {
        fireEvent.change(hoursInput, { target: { value: '0' } });
      });
      expect(hoursInput.value).toBe('');
      
      // Try to enter 16 (should be allowed as per component implementation)
      await act(async () => {
        fireEvent.change(hoursInput, { target: { value: '16' } });
      });
      expect(hoursInput.value).toBe('16');
      
      // Try to enter valid number
      await act(async () => {
        fireEvent.change(hoursInput, { target: { value: '3' } });
      });
      expect(hoursInput.value).toBe('3');
    });
  });

  describe('API Interaction Tests', () => {
    it('should fetch courses on component mount', async () => {
      const mockCourses = [
        { department: 'CPIT', course_number: 250, course_name: 'Test Course', hours: 3 }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: mockCourses })
      });

      render(<ShowCoursesPopUp />);
      
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

    it('should handle course creation successfully', async () => {
      // First mock for initial courses fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: [] })
      });

      // Second mock for course creation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      // Third mock for the refresh after course creation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: [] })
      });

      render(<ShowCoursesPopUp />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();
      });
      
      // Open create form
      await act(async () => {
        fireEvent.click(screen.getByText('Create New Course'));
      });
      
      // Fill form
      await act(async () => {
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
      });
      
      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByText('Save'));
      });
      
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

    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      render(<ShowCoursesPopUp />);
      
      // Wait for the error to be handled
      await waitFor(() => {
        expect(screen.getByText('Loading courses...')).toBeInTheDocument();
      });
    });
  });
}); 