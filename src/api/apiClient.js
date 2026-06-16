import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('texorax_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async ({ email, password, role }) => {
    const response = await apiClient.post('/auth/register', { email, password, role });
    return response.data;
  },

  verifyOtp: async ({ email, otpCode }) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otpCode });
    
    // FIX: Save the ID alongside the token and role!
    localStorage.setItem('texorax_token', response.data.access_token);
    localStorage.setItem('texorax_role', response.data.user.role);
    localStorage.setItem('texorax_user_id', response.data.user.id.toString()); 
    localStorage.setItem('texorax_email', response.data.user.email);

    return response.data;
  },

  resendOtp: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
  },

  login: async (email, password, role) => {
    const response = await apiClient.post('/auth/login', { email, password, role });
    
    // FIX: Save the ID alongside the token and role!
    localStorage.setItem('texorax_token', response.data.access_token);
    localStorage.setItem('texorax_role', response.data.user.role);
    localStorage.setItem('texorax_user_id', response.data.user.id.toString());
    localStorage.setItem('texorax_coi_signed', response.data.user.coi_signed.toString());
    localStorage.setItem('texorax_email', response.data.user.email);

    return {
      token: response.data.access_token,
      user: response.data.user 
    };
  },
  
// Inside authService...
  updateProfile: async ({ userId, full_name, interests, coi_signed }) => {
    // Ensure we are using POST!
    const response = await apiClient.post('/auth/update-profile', { 
      userId, 
      full_name, 
      interests, 
      coi_signed 
    });
    
    if (response.data.user.full_name) {
      localStorage.setItem('texorax_user_name', response.data.user.full_name);
    }
    if (response.data.user.coi_signed) {
      localStorage.setItem('texorax_coi_signed', 'true');
    }
    
    return response.data;
  },
  
  me: async () => {
    const token = localStorage.getItem('texorax_token');
    if (!token) throw new Error("No token");
    
    // FIX: Pull the real ID from memory!
    const savedId = localStorage.getItem('texorax_user_id') || "1"; 
    const savedRole = localStorage.getItem('texorax_role') || "applicant";
    const hasSigned = localStorage.getItem('texorax_coi_signed') === 'true';
    const savedName = localStorage.getItem('texorax_user_name'); // Pull the name too!
    const savedEmail = localStorage.getItem('texorax_email');

    return { 
      id: savedId, 
      email: savedEmail,
      role: savedRole, 
      full_name: savedName,
      coi_signed: hasSigned 
    };
  },

  logout: () => {
    localStorage.removeItem('texorax_token');
    localStorage.removeItem('texorax_role');
    localStorage.removeItem('texorax_coi_signed');
    localStorage.removeItem('texorax_user_name');
    window.location.href = '/login';
  }
};