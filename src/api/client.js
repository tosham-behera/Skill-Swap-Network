import axios from 'axios';

// Shared axios instance for the SkillBridge backend.
// The JWT lives in an httpOnly cookie, so every request must send credentials.
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true,
});

/**
 * Extracts a human-readable message from an API error response.
 * Backend error shape: { error: { code, message } }
 */
export function getApiErrorMessage(err) {
  const backendMessage = err?.response?.data?.error?.message;
  if (backendMessage) return backendMessage;
  if (err?.request) {
    return 'Cannot reach the server. Is the backend running on http://localhost:4000?';
  }
  return err?.message || 'Something went wrong. Please try again.';
}

export default api;
