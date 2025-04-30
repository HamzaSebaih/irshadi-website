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
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/})).toBeInTheDocument();
  });
  // Second test
  test('shows errors when submitting empty form', async () => {
    load();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/}));

    expect(await screen.findByText(/First name is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Last name is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Email is required\./)).toBeInTheDocument();
    expect(screen.getByText(/Password can't be empty\./)).toBeInTheDocument();
    expect(screen.getByText(/Re-enter your password\./)).toBeInTheDocument();
    expect(screen.getByText(/You must agree on terms\./)).toBeInTheDocument();
  });
  // Thrid test
  test('shows error on invalid email format', async () => {
    load();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'waleed' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/}));
    expect(await screen.findByText(/Email format is incorrect\./)).toBeInTheDocument();
  });
  // Fourth test
  test('renders password strength indicators', () => {
    load();
    const pw = screen.getByLabelText(/^Password$/);

    // weak pw
    fireEvent.change(pw, { target: { value: 'abc' } });
    expect(screen.getByText(/At least one uppercase letter/)).toBeInTheDocument();
    expect(screen.getByText(/At least one number/)).toBeInTheDocument();
    expect(screen.getByText(/Minimum 8 characters/)).toBeInTheDocument();

    // strong pw
    fireEvent.change(pw, { target: { value: 'ValidPassword1' } });
    expect(screen.getByText(/At least one uppercase letter/)).toBeInTheDocument();
    expect(screen.getByText(/At least one number/)).toBeInTheDocument();
    expect(screen.getByText(/Minimum 8 characters/)).toBeInTheDocument();
  });
  // fifth test
  test('shows error when passwords do not match', async () => {
    load();
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'Mismatch1' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    expect(await screen.findByText(/Passwords don't match./)).toBeInTheDocument();
  });
  // sixth test
  test('requires agreeing to terms', async () => {
    load();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/ }));
    expect(await screen.findByText(/You must agree on terms./)).toBeInTheDocument();
  });
  // seventh test
  test('submits when valid and shows success message', async () => {
    mockSignup.mockResolvedValue({ user: { email: 'waleed@gmail.com' } });
    load();
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Waleed' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Alsafari' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'waleed@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/), { target: { value: 'ValidPassword1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'ValidPassword1' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/)); // terms checkbox
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/}));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('waleed@gmail.com', 'ValidPassword1');
    });
    expect(await screen.findByText(/Check your inbox to verify your email!/)).toBeInTheDocument();
  });
});
