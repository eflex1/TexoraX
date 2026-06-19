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
    
    localStorage.setItem('texorax_token', response.data.access_token);
    localStorage.setItem('texorax_role', response.data.user.role);
    localStorage.setItem('texorax_user_id', response.data.user.id.toString()); 
    localStorage.setItem('texorax_email', response.data.user.email);
    localStorage.setItem('texorax_interests', response.data.user.interests || '');
    
    
    if (response.data.user.full_name) localStorage.setItem('texorax_user_name', response.data.user.full_name);
    if (response.data.user.phone) localStorage.setItem('texorax_phone', response.data.user.phone);
    if (response.data.user.organization) localStorage.setItem('texorax_org', response.data.user.organization);
    if (response.data.user.language) localStorage.setItem('texorax_lang', response.data.user.language);
    if (response.data.user.avatar_url) localStorage.setItem('texorax_avatar', response.data.user.avatar_url);

    return response.data;
  },

  resendOtp: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
  },

  login: async (email, password, role) => {
    const response = await apiClient.post('/auth/login', { email, password, role });
    
    localStorage.setItem('texorax_token', response.data.access_token);
    localStorage.setItem('texorax_role', response.data.user.role);
    localStorage.setItem('texorax_user_id', response.data.user.id.toString());
    localStorage.setItem('texorax_coi_signed', response.data.user.coi_signed?.toString() || 'false');
    localStorage.setItem('texorax_email', response.data.user.email);
    localStorage.setItem('texorax_interests', response.data.user.interests || '');

    if (response.data.user.full_name) localStorage.setItem('texorax_user_name', response.data.user.full_name);
    if (response.data.user.phone) localStorage.setItem('texorax_phone', response.data.user.phone);
    if (response.data.user.organization) localStorage.setItem('texorax_org', response.data.user.organization);
    if (response.data.user.language) localStorage.setItem('texorax_lang', response.data.user.language);
    if (response.data.user.avatar_url) localStorage.setItem('texorax_avatar', response.data.user.avatar_url);

    return {
      token: response.data.access_token,
      user: response.data.user 
    };
  },
  
  updateProfile: async ({ userId, full_name, interests, coi_signed, phone, organization, language, avatar_url }) => {
    const response = await apiClient.post('/auth/update-profile', { 
      userId, 
      full_name, 
      interests, 
      coi_signed,
      phone,
      organization,
      language,
      avatar_url
    });
    
    const u = response.data.user;
    if (u.full_name) localStorage.setItem('texorax_user_name', u.full_name);
    if (u.coi_signed) localStorage.setItem('texorax_coi_signed', 'true');
    if (u.interests) localStorage.setItem('texorax_interests', u.interests);
    if (u.phone) localStorage.setItem('texorax_phone', u.phone);
    if (u.organization) localStorage.setItem('texorax_org', u.organization);
    if (u.language) localStorage.setItem('texorax_lang', u.language);
    if (u.avatar_url) localStorage.setItem('texorax_avatar', u.avatar_url);

    return response.data;
  },
  
  me: async () => {
    const token = localStorage.getItem('texorax_token');
    if (!token) throw new Error("No token");
    
    const savedId = localStorage.getItem('texorax_user_id') || "1"; 
    const savedRole = localStorage.getItem('texorax_role') || "applicant";
    const hasSigned = localStorage.getItem('texorax_coi_signed') === 'true';
    const savedName = localStorage.getItem('texorax_user_name'); 
    const savedEmail = localStorage.getItem('texorax_email');
    const savedInterests = localStorage.getItem('texorax_interests');
    const savedPhone = localStorage.getItem('texorax_phone') || '';
    const savedOrg = localStorage.getItem('texorax_org') || '';
    const savedLang = localStorage.getItem('texorax_lang') || 'en';
    const savedAvatar = localStorage.getItem('texorax_avatar') || '';

    return { 
      id: savedId, 
      email: savedEmail,
      role: savedRole, 
      full_name: savedName,
      coi_signed: hasSigned,
      interests: savedInterests,
      phone: savedPhone,
      organization: savedOrg,
      language: savedLang,
      avatar_url: savedAvatar
    };
  },

  resetPasswordRequest: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async ({ resetToken, newPassword }) => {
    const response = await apiClient.post('/auth/reset-password', { 
      token: resetToken, 
      newPassword 
    });
    return response.data;
  },

  changePassword: async ({ userId, currentPassword, newPassword }) => {
    const response = await apiClient.post('/auth/change-password', { 
      userId, 
      currentPassword, 
      newPassword 
    });
    return response.data;
  },

  uploadFile: async (file) => {
    // Files must be packaged into FormData, not JSON!
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('texorax_token');
    localStorage.removeItem('texorax_role');
    localStorage.removeItem('texorax_coi_signed');
    localStorage.removeItem('texorax_user_name');
    localStorage.removeItem('texorax_user_id');
    localStorage.removeItem('texorax_email');
    localStorage.removeItem('texorax_interests');
    localStorage.removeItem('texorax_phone');
    localStorage.removeItem('texorax_org');
    localStorage.removeItem('texorax_lang');
    localStorage.removeItem('texorax_avatar');
    
    window.location.href = '/login';
  }
};