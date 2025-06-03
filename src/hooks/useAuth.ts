// src/hooks/useAuth.ts
// This is for backward compatibility with existing screens
// New screens should import directly from contexts/AuthContext

import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Re-export the context hook for backward compatibility
export default useAuthContext;