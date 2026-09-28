import { createContext } from 'react';

// Shared context instance (imported by the provider and the useAuth hook).
const AuthContext = createContext(null);

export default AuthContext;
