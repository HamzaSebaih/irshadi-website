import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from '../../SignupPage'; // Adjust the import path as needed
import { BrowserRouter } from 'react-router-dom';

// Mock the dependencies and context
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock the AuthContext
const mockSignup = jest.fn();
const mockLogout = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    logout: mockLogout
  })
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    signOut: jest.fn().mockResolvedValue(true)
  })),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  sendEmailVerification: jest.fn().mockResolvedValue(true)
}));

jest.mock('lottie-react', () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-animation" />
}));

jest.mock('../../../assets/Animation.json', () => ({}));

// Mock the Lucide React icons
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  }
}));

describe('SignupPage Form Validation', () => {
  const renderSignupPage = () => {
    return render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic rendering test
  test('renders signup form with all required fields', () => {
    renderSignupPage();
    
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  // Empty form validation test
  test('shows validation errors when form is submitted empty', async () => {
    renderSignupPage();
    
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    
    expect(await screen.findByText(/First name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Last name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please confirm your password/i)).toBeInTheDocument();
    expect(await screen.findByText(/You must agree to the Terms and Conditions/i)).toBeInTheDocument();
  });

  // Email validation test
  test('validates email format correctly', async () => {
    renderSignupPage();
    
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    
    expect(await screen.findByText(/Invalid email format/i)).toBeInTheDocument();
  });

  // Password requirements test
  test('validates password requirements correctly', async () => {
    renderSignupPage();
    
    const passwordInput = screen.getByLabelText(/^Password$/i);
    
    // Test password with only lowercase letters
    fireEvent.change(passwordInput, { target: { value: 'onlylowercase' } });
    
    expect(screen.getByText(/✗ At least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/✗ At least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Minimum 8 characters/i)).toBeInTheDocument();
    
    // Test complete valid password
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
    
    expect(screen.getByText(/✓ At least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ At least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Minimum 8 characters/i)).toBeInTheDocument();
  });

  // Password matching test
  test('validates password matching correctly', async () => {
    renderSignupPage();
    
    // Fill required fields to avoid other validation errors
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  // Terms and conditions test
  test('validates terms and conditions agreement', async () => {
    renderSignupPage();
    
    // Fill in all required fields with valid data
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'johndoe@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'ValidPassword123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'ValidPassword123' } });
    
    // Don't check terms checkbox yet
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    
    expect(await screen.findByText(/You must agree to the Terms and Conditions/i)).toBeInTheDocument();
  });

  // Successful submission test
  test('submits form successfully with valid data', async () => {
    // Mock successful signup
    mockSignup.mockResolvedValue({ user: { email: 'test@example.com' } });
    
    renderSignupPage();
    
    // Fill in all required fields with valid data
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'johndoe@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'ValidPassword123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'ValidPassword123' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));
    
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('johndoe@example.com', 'ValidPassword123');
    });
    
    expect(await screen.findByText(/A verification email has been sent/i)).toBeInTheDocument();
  });
});