import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShowCoursesPopUp from '../ShowCoursesPopUp';
import { useAuth } from '../../contexts/AuthContext';

// mocking auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// creating fake fetch for testing
global.fetch = jest.fn();

describe('ShowCoursesPopUp', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // clean previous mocks before each test
    
    // fake user with a token function
    useAuth.mockReturnValue({
      user: {
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      },
    });
  });

  it('fetches and shows courses when the component loads', async () => {
    // this is the course it should fetch
    const sampleCourses = [
      { department: 'CPIT', course_number: 250, course_name: 'Software Engineering', hours: 3 },
    ];

    // simulate fetch returning course list
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courses: sampleCourses }),
    });

    render(<ShowCoursesPopUp />); // show the component

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
    // mocking both getCourses and addCourse API
    fetch.mockImplementation((url) => {
      if (url.includes('getCourses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ courses: [] }), // no courses first
        });
      }
      if (url.includes('addCourse')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.reject('Unknown endpoint');
    });

    render(<ShowCoursesPopUp />);

    // wait for the form to load
    await waitFor(() => screen.getByText('Create New Course'));

    // simulate user typing values
    fireEvent.click(screen.getByText('Create New Course'));

    fireEvent.change(screen.getByPlaceholderText('Ex. CPIT'), {
      target: { value: 'CPIT' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ex. 250'), {
      target: { value: '250' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ex. 3'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ex. Software Engineering 1'), {
      target: { value: 'Test Course' },
    });

    // click save to add the course
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
      // check if fallback UI still shows
      expect(screen.getByText('Available Courses')).toBeInTheDocument();
    });

    // list shouldn't show any course items
    expect(screen.queryByRole('listitem')).toBeNull();
  });
});
