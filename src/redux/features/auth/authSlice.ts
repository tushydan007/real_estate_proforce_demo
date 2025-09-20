import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getUserFromToken, isTokenExpired } from "../../../lib/jwt";


// Define the shape of the user object (adjust based on your API response)
export interface User {
  id?: number;
  user_id?: number;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};


export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    
    setToken: (state, action: PayloadAction<string>) => {
      const token = action.payload;
      state.token = token;
      
      // Automatically decode user from token
      const user = getUserFromToken(token);
      if (user) {
        // Map token payload to user object
        state.user = {
          id: typeof user.user_id === "number" ? user.user_id : typeof user.id === "number" ? user.id : undefined,
          email: typeof user.email === "string" ? user.email : undefined,
          username: typeof user.username === "string" ? user.username : undefined,
          first_name: typeof user.first_name === "string" ? user.first_name : undefined,
          last_name: typeof user.last_name === "string" ? user.last_name : undefined,
          ...user
        };
        state.isAuthenticated = true;
        state.isLoading = false;
        
        // Store token in localStorage for persistence
        localStorage.setItem('authToken', token);
      } else {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        localStorage.removeItem('authToken');
      }
    },
    
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      localStorage.removeItem('authToken');
    },
    
    // Initialize auth state from localStorage
    initializeAuth: (state) => {
      const token = localStorage.getItem('authToken');
      if (token && !isTokenExpired(token)) {
        const user = getUserFromToken(token);
        if (user) {
          state.token = token;
          state.user = {
            id: user.user_id || user.id,
            email: typeof user.email === "string" ? user.email : undefined,
            username: typeof user.username === "string" ? user.username : undefined,
            first_name: typeof user.first_name === "string" ? user.first_name : undefined,
            last_name: typeof user.last_name === "string" ? user.last_name : undefined,
            ...user
          };
          state.isAuthenticated = true;
        } else {
          localStorage.removeItem('authToken');
        }
      }
      state.isLoading = false;
    },
    
    // Check if current token is still valid
    validateToken: (state) => {
      if (state.token && isTokenExpired(state.token)) {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { 
  setUser, 
  setToken, 
  clearUser, 
  initializeAuth, 
  validateToken,
  setLoading
} = authSlice.actions;

export default authSlice.reducer;

// Usage examples:

// 1. After login, when you receive a JWT from your API:
// dispatch(setToken(jwtTokenFromAPI));

// 2. On app initialization (e.g., in your main App component):
// useEffect(() => {
//   dispatch(initializeAuth());
// }, [dispatch]);

// 3. Periodically check token validity (optional):
// useEffect(() => {
//   const interval = setInterval(() => {
//     dispatch(validateToken());
//   }, 60000); // Check every minute
//   return () => clearInterval(interval);
// }, [dispatch]);

// 4. Login hook example:
// const useAuth = () => {
//   const dispatch = useDispatch();
//   
//   const login = async (credentials: LoginCredentials) => {
//     try {
//       const response = await api.login(credentials);
//       dispatch(setToken(response.data.token));
//       return true;
//     } catch (error) {
//       console.error('Login failed:', error);
//       return false;
//     }
//   };
//   
//   const logout = () => {
//     dispatch(clearUser());
//   };
//   
//   return { login, logout };
// };