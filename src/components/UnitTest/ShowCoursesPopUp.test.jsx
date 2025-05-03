import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShowCoursesPopUp from '../ShowCoursesPopUp';
import { useAuth } from '../../contexts/AuthContext';

// fake auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// creating fake fetch for testing
global.fetch = jest.fn();

describe('ShowCoursesPopUp test', () => {
  const load = () => // method to load the virtual screen
    render(
      <ShowCoursesPopUp />
    );
    // mock console errors and alerts 
    beforeAll(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      window.alert = jest.fn();
    });

  // clean previous mocks before each test
  beforeEach(() => {
    jest.clearAllMocks(); 

    // fake user with a test token
    useAuth.mockReturnValue({
      user: {
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      },
    });
  });

  test('fetch and show courses when the component loads', async () => {
    // course info to be fetch
    const sampleCourses = [
      { department: 'CPIT', course_number: 250, course_name: 'Software Engineering', hours: 3 },
    ];

    // simulate fetch returning course list
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: sampleCourses }),
    });

    load(); // rander the popUp screen virtually within the test

    await waitFor(() => {
      // make sure the request was sent with the token and specified back-end URL
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

  test('add a course using the form input', async () => {
    load(); // rander the popUp screen virtually within the test
    // wait for the rander method to be completed and then make sure a text displayed says "Create New Course"
    await waitFor(() => screen.getByText('Create New Course'));
    // simulate clicking on the "Create New Course" button 
    fireEvent.click(screen.getByText('Create New Course'));
    // in the next lines we simulate filling the input form required to add a new course
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
      target: { value: 'Software Engineering' },
    });
    // simulate clicking on the button to save the course
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
            course_name: 'Software Engineering',
            hours: 3,
          }),
        })
      );
    });
  });

  test('handles API errors without crashing', async () => {
    // make fetch fail
    fetch.mockRejectedValueOnce(new Error('API Error'));

    load(); // rander the popUp screen virtually within the test

    await waitFor(() => {
      // check if the pop up still rander 
      expect(screen.getByText('Available Courses')).toBeInTheDocument();
    });

    // list shouldn't show any course items
    expect(screen.queryByRole('listitem')).toBeNull();
  });
});
