import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MockTestRunner } from './MockTestRunner';

// Mock the API client
jest.mock('../App', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: [{ id: 1, subject: 'Maths', question_text: 'Test Q' }] }),
    post: jest.fn().mockResolvedValue({ data: { attempt_id: 123 } })
  }
}));

// Mock Fullscreen API
document.documentElement.requestFullscreen = jest.fn().mockResolvedValue();
document.exitFullscreen = jest.fn().mockResolvedValue();

// Mock window functions
window.open = jest.fn();
window.close = jest.fn();
window.confirm = jest.fn().mockReturnValue(true);

describe('MockTestRunner Proctoring Strike System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('increments flags and auto-submits on 3rd strike', async () => {
    render(
      <MemoryRouter initialEntries={['/runner/1']}>
        <Routes>
          <Route path="/runner/:quizId" element={<MockTestRunner />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for questions to load
    const qText = await screen.findByText('Test Q');
    expect(qText).toBeInTheDocument();

    // Trigger 1st strike (e.g. visibility change)
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    expect(await screen.findByText(/Warning 1\/3/)).toBeInTheDocument();
    
    // Dismiss modal
    fireEvent.click(screen.getByText('I Understand'));
    
    // Trigger 2nd strike (Blur)
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    
    expect(await screen.findByText(/Warning 2\/3/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('I Understand'));
    
    // Trigger 3rd strike (Fullscreen exit)
    act(() => {
      // simulate no fullscreen element
      Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    
    expect(await screen.findByText(/Warning 3\/3/)).toBeInTheDocument();
    
    // The "I Understand" button should be missing because isLocked = true
    expect(screen.queryByText('I Understand')).not.toBeInTheDocument();
  });
});
