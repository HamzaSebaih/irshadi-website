import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from '../../pages/LoginPages/SignupPage';
import { BrowserRouter } from 'react-router';

// mocking react-router navigation function
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => jest.fn() // this just replaces real nav with a fake one
}));

// these are just fake signup and logout funcs we use in tests
const mockSignup = jest.fn();
const mockLogout = jest.fn();

// mocking the real auth context with our fake funcs
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    logout: mockLogout

  })
}));

// fake firebase stuff here so tests don't use real firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ signOut: jest.fn().mockResolvedValue(true) })),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  sendEmailVerification: jest.fn().mockResolvedValue(true)
}));

// mock animation so we dont care about the visuals
jest.mock('lottie-react', () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-animation" />
}));

jest.mock('../../assets/Animation.json', () => ({}));

// same for icons, just faking them
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />, // eye icon
  EyeOff: () => <div data-testid="eye-off-icon" /> // eye off icon
}));

// and faking animation motion from framer
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  }
}));

describe('Signup page form tests', () => {
  // func to load our SignupPage wrapped with a router
  const loadSignupPage = () =>
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks(); // clean all mocked funcs before every test
  });

  test('shows all the form inputs and sign up button', () => {
    loadSignupPage();
    // check if every field is on screen
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('show errors if user dont type anything and click submit', async () => {
    loadSignupPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    // these errors should show if form left empty
    expect(await screen.findByText(/First name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Please confirm your password/i)).toBeInTheDocument();
    expect(screen.getByText(/You must agree to the Terms and Conditions/i)).toBeInTheDocument();
  });

  test('show error if email format is not valid', async () => {
    loadSignupPage();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'invalid' } // this is not an email
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(await screen.findByText(/Invalid email format/i)).toBeInTheDocument();
  });

  test('check password rules when typing', () => {
    loadSignupPage();
    const passwordInput = screen.getByLabelText(/^Password$/i);

    // try weak password first
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    expect(screen.getByText(/✗ At least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/✗ At least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Minimum 8 characters/i)).toBeInTheDocument();

    // now type a strong one
    fireEvent.change(passwordInput, { target: { value: 'Valid123' } });
    expect(screen.getByText(/✓ At least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ At least one number/i)).toBeInTheDocument();
  });

  test('error if password and confirm password not same', async () => {
    loadSignupPage();

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Waleed' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Alsafari' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'waleed@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'ValidPass1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'NotMatch' } });

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test('user must check the terms checkbox or error will show', async () => {
    loadSignupPage();

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Waleed' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Alsafari' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'waleed@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'ValidPass1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'ValidPass1' } });

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(await screen.findByText(/You must agree to the Terms and Conditions/i)).toBeInTheDocument();
  });

  test('send form if every field is correct and checkbox is checked', async () => {
    // this fakes a success signup
    mockSignup.mockResolvedValue({ user: { email: 'test@example.com' } });

    loadSignupPage();

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Waleed' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Alsafari' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'waleed@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'ValidPass1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'ValidPass1' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    // check if signup got called with correct data
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('waleed@gmail.com', 'ValidPass1');
    });

    expect(await screen.findByText(/A verification email has been sent/i)).toBeInTheDocument();
  });
});
