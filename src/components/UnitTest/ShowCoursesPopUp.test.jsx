import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShowCoursesPopUp from '../ShowCoursesPopUp';
import { useAuth } from '../../contexts/AuthContext';

// fake auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// creating fake fetch for testing
global.fetch = jest.fn();

describe('ShowCoursesPopUp', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // clean previous mocks before each test
    
    // fake user with a test token
    useAuth.mockReturnValue({
      user: {
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      },
    });
  });

  it('fetches and shows courses when the component loads', async () => {
    // course info to be fetch
    const sampleCourses = [
      { department: 'CPIT', course_number: 250, course_name: 'Software Engineering', hours: 3 },
    ];

    // simulate fetch returning course list
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: sampleCourses }),
    });

    render(<ShowCoursesPopUp />); 

    await waitFor(() => {
      // make sure the request was sent with the token
      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/getCourses',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'test-token',
          }),
        })
      );
    });
  });

  it('adds a course using the form input', async () => {
    render(<ShowCoursesPopUp />);

    await waitFor(() => screen.getByText('Create New Course'));

    fireEvent.click(screen.getByText('Create New Course'));

    fireEvent.change(screen.getByLabelText(/Department/), {
      target: { value: 'CPIT' },
    });
    fireEvent.change(screen.getByLabelText(/Course Number/), {
      target: { value: '250' },
    });
    fireEvent.change(screen.getByLabelText(/Hours/), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText(/Course Name/), {
      target: { value: 'Test Course' },
    });

    fireEvent.click(screen.getByText('Save Course'));

    await waitFor(() => {
      // check if addCourse was called properly
      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/addCourse',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            department: 'CPIT',
            course_number: 250,
            course_name: 'Test Course',
            hours: 3,
          }),
        })
      );
    });
  });

  it('still works even if API fails', async () => {
    // make fetch fail
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<ShowCoursesPopUp />);

    await waitFor(() => {
      // check if the pop up still rander 
      expect(screen.getByText('Available Courses')).toBeInTheDocument();
    });

    // list shouldn't show any course items
    expect(screen.queryByRole('listitem')).toBeNull();
  });
});
