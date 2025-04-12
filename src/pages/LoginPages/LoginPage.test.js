import test from 'ava';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';

test('renders login page correctly', (t) => {
  const { getByText } = render(<LoginPage />);
  t.true(getByText('Login').textContent === 'Login'); // Adjust this based on your component's content
});
