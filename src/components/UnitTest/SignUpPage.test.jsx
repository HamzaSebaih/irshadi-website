import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from '../../pages/LoginPages/SignupPage';
import { BrowserRouter } from 'react-router';

// fake navigation method so we can inspect it
const mockNavigate = jest.fn();

// fake navigation method with an empty one so our test stuck within the virtual sign up page
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

// fake firebase methods
const mockSignup = jest.fn();
const mockLogout = jest.fn();
const mockSendVerificationEmail = jest.fn();
const mockGoogleLogin = jest.fn();
const mockStoreName = jest.fn(); 
// assign the mocked function to the firebase
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    logout: mockLogout,
    sendVerificationEmail: mockSendVerificationEmail,
    googleLogin: mockGoogleLogin,
    storeName: mockStoreName, 
  }),
}));

// replace all visual elements like lottie animation and icons with simple div tag
jest.mock('lottie-react', () => ({ __esModule: true, default: () => <div data-testid="lottie-animation" /> }));
jest.mock('../../assets/Animation.json', () => ({}));
jest.mock('lucide-react', () => ({ Eye: () => <div data-testid="eye-icon" />, EyeOff: () => <div data-testid="eye-off-icon" /> }));

// remove animations (fade in) from div and tag elements with normal one (no animation)
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }) => <button {...props}>{children}</button>,
  },
}));

describe('SignupPage test', () => {
  // helper to render component inside router
  const load = () =>
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });
  // first test
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
  // second test
  test('displays required-field messages when submitting empty form', async () => {
    load(); // rander the sign up screen virtually within the test

    // simulate clicking on the sign up button without filling the form elements
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));

    // during this stage, warning message should be displayed under each input fileds to prompts the user to fill them all
    expect(await screen.findByText(/First name is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Last name is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Email is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Password can't be empty\./)).toBeInTheDocument();
    expect(screen.getByText(/Re-enter your password\./)).toBeInTheDocument();
    expect(screen.getByText(/You must agree on terms\./)).toBeInTheDocument();
  });
  // third test
  test('validate email format before submitting the form', async () => {
    load(); // rander the sign up screen virtually within the test//

    // simulate typing incorrect email format
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'waleed' } });
    // simulate clicking the sign up button
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    // a message should appear telling the user email format is incorrect
    expect(await screen.findByText(/Email format is incorrect\./)).toBeInTheDocument();
  });
  // fourth test
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
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: 'Pass1' } });

    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'Mismatch1' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    // when clicking the sign up button, it should display "Passwords don't match"
    expect(await screen.findByText(/Passwords don't match\./)).toBeInTheDocument();
  });
  // sixth test
  test('requires agreeing to terms', async () => {
    load(); // rander the sign up screen virtually within the test

    // simulate clicking on sign up button without agreeing on terms
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    // a message will appear saying "You must agree on terms" before sign up can procced 
    expect(await screen.findByText(/You must agree on terms\./)).toBeInTheDocument();
  });
  // seventh test
  test('Sign up successfully and shows success message', async () => {
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
    // here we wait until our fake signup method called with a verification email and then logout
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('waleed@gmail.com', 'ValidPassword1');
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(expect.any(Object));
      expect(mockLogout).toHaveBeenCalled();
    });
    // here it should appear a message indicating sign up was successed 
    expect(await screen.findByText(/Check your inbox to verify your email!/)).toBeInTheDocument();
  });
  // eighth test
  test('allows Google login and navigates to loading', async () => {
    mockGoogleLogin.mockResolvedValue();
    load(); // rander the sign up screen virtually within the test
    // simulate clicking on the google login button
    fireEvent.click(screen.getByText(/Continue with Google/));
    // wait untill the fake google login method called and navigation 
    await waitFor(() => {
      expect(mockGoogleLogin).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/loading');
    });
  });
});
