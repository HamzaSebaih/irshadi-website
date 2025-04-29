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
    load();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });
  // Second test
  test('shows errors when submitting empty form', async () => {
    load();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(await screen.findByText(/First name is required\./i)).toBeInTheDocument();
    expect(screen.getByText(/Last name is required\./i)).toBeInTheDocument();
    expect(screen.getByText(/Email is required\./i)).toBeInTheDocument();
    expect(screen.getByText(/Password can't be empty\./i)).toBeInTheDocument();
    expect(screen.getByText(/Re-enter your password\./i)).toBeInTheDocument();
    expect(screen.getByText(/You must agree on terms\./i)).toBeInTheDocument();
  });
  // Thrid test
  test('shows error on invalid email format', async () => {
    load();
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'waleed' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    expect(await screen.findByText(/Email format is incorrect\./i)).toBeInTheDocument();
  });
  // Fourth test
  test('renders password strength indicators', () => {
    load();
    const pw = screen.getByLabelText(/^Password$/i);

    // weak pw
    fireEvent.change(pw, { target: { value: 'abc' } });
    expect(screen.getByText(/At least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/At least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimum 8 characters/i)).toBeInTheDocument();

    // strong pw
    fireEvent.change(pw, { target: { value: 'ValidPassword1' } });
    expect(screen.getByText(/At least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/At least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimum 8 characters/i)).toBeInTheDocument();
  });
  // fifth test
  test('shows error when passwords do not match', async () => {
    load();
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Mismatch1' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    expect(await screen.findByText(/Passwords don't match./i)).toBeInTheDocument();
  });
  // sixth test
  test('requires agreeing to terms', async () => {
    load();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    expect(await screen.findByText(/You must agree on terms./i)).toBeInTheDocument();
  });
  // seventh test
  test('submits when valid and shows success message', async () => {
    mockSignup.mockResolvedValue({ user: { email: 'waleed@gmail.com' } });
    load();
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Waleed' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Alsafari' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'waleed@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'ValidPassword1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'ValidPassword1' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i)); // terms checkbox
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('waleed@gmail.com', 'ValidPassword1');
    });
    expect(await screen.findByText(/Check your inbox to verify your email!/i)).toBeInTheDocument();
  });
});
