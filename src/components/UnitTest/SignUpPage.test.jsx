import React from 'react'; // to compile the code with react
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from '../../pages/LoginPages/SignupPage';
import { BrowserRouter } from 'react-router'; // to mock the sign up page and avoid any crashs

// fake navigation method with an empty one so our test stuck within the virtual sign up page
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => jest.fn(),
}));

// fake signup and logout methods
const mockSignup = jest.fn();
const mockLogout = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    logout: mockLogout,
  }),
}));

// fake firebase object connection and methods
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ signOut: jest.fn().mockResolvedValue(true) })),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  sendEmailVerification: jest.fn().mockResolvedValue(true),
}));

// replace all visual elements like lottie animation and icons with simple div tag
jest.mock('lottie-react', () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-animation" />,
}));
jest.mock('../../assets/Animation.json', () => ({}));
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
}));
// remove animations (fade in) from div and tag elements with normal one (no animation)
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));
// prepare tests
describe('SignupPage form', () => {
  const load = () => // method to load the virtual screen
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );
  // clean before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  // First test
  test('renders all inputs and the Sign Up button', () => {
    load(); // rander the sign up screen virtually within the test
    // from the line 64 till 70, it will serach for each text within '//', these elements are input fileds and buttons which are the core elements for the page
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/ })).toBeInTheDocument();
  });
  // Second test
  test('displays required-field messages when trying to submit empty form', async () => {
    load(); // rander the sign up screen virtually within the test

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ })); // simulate clicking on the sign up button without filling the form elements
    // during this stage, a message should be displayed under each input fileds to prompts the user to fill them all
    expect(await screen.findByText(/First name is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Last name is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Email is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Password can't be empty\./)).toBeInTheDocument();
    expect(screen.getByText(/Re-enter your password\./)).toBeInTheDocument();
    expect(screen.getByText(/You must agree on terms\./)).toBeInTheDocument();
  })
  // Thrid test
  test('validate email format before submitting the form', async () => {
    load(); // rander the sign up screen virtually within the test
    // simulate typing incorrect email format
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'waleed' } });
    // simulate clicking the sign up button
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    // a message should appear telling the user email format is incorrect
    expect(await screen.findByText(/Email format is incorrect\./)).toBeInTheDocument();
  });
  // Fourth test
  test('display password strength indicators', () => {
    load(); // rander the sign up screen virtually within the test

    // when entering a weak password, indicators should be colored grey
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: 'abc' } });
    const uppercase = screen.getByText(/At least one uppercase letter/);
    const number = screen.getByText(/At least one number/);
    const length = screen.getByText(/Minimum 8 characters/);
    // check if they are grey or not
    expect(uppercase).toHaveClass('text-gray-500');
    expect(number).toHaveClass('text-gray-500');
    expect(length).toHaveClass('text-gray-500');

    // when entering a strong password, indicators should be colored green
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: 'ValidPassword1' } });
    // check if they are green or not
    expect(uppercase).toHaveClass('text-green-600');
    expect(number).toHaveClass('text-green-600');
    expect(length).toHaveClass('text-green-600');
  });
  // fifth test
  test("show an error message when passwords don't match", async () => {
    load(); // rander the sign up screen virtually within the test

    // Typing a diffrent passwords in password and confirm password fields
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'Mismatch1' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    // when clicking the sign up button, it should display "Passwords don't match"
    expect(await screen.findByText(/Passwords don't match./)).toBeInTheDocument();
  });
  // sixth test
  test('requires agreeing to terms', async () => {
    load(); // rander the sign up screen virtually within the test

    // simulate clicking on sign up button without agreeing on terms
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    // a message will appear saying "You must agree on terms" before sign up can procced 
    expect(await screen.findByText(/You must agree on terms./)).toBeInTheDocument();
  });
  // seventh test
  test('sign up succefully and shows success message', async () => {
    // here we fake the sign up method and pretend that user was created 
    mockSignup.mockResolvedValue({ user: { email: 'waleed@gmail.com' } });
    load(); // rander the sign up screen virtually within the test
    // filling the input fields
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Waleed' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Alsafari' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'waleed@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: 'ValidPassword1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'ValidPassword1' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/)); 
    // simulate clicking on the sign up button
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    // here we wait until our fake signup method called 
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('waleed@gmail.com', 'ValidPassword1');
    });
    // here it should appear a message indicating sign up was successed 
    expect(await screen.findByText(/Check your inbox to verify your email!/)).toBeInTheDocument();
  });
});
