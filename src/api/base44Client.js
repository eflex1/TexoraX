// src/api/base44Client.js
import { authService } from './apiClient';

const handleCoiSigning = (data) => {
  if (data && (data.coi_signed === true || data.coiAccepted === true)) {
    localStorage.setItem('texorax_coi_signed', 'true');
    
    setTimeout(() => {
      window.location.reload();
    }, 300);
    return true;
  }
  return false;
};

const dummyEntities = new Proxy({}, {
  get: function(target, tableName) {
    return {
      list: async () => [],
      filter: async () => [],
      get: async () => ({ id: "mock-id" }),
      create: async (data) => {
        handleCoiSigning(data);
        return { id: "mock-id", ...data };
      },
      update: async (id, data) => {
        handleCoiSigning(data);
        return { id, ...data };
      },
      delete: async () => ({ success: true })
    };
  }
});

export const base44 = {
  auth: {
    me: authService.me,
    login: authService.login,
    logout: authService.logout,
    register: authService.register, 
    verifyOtp: authService.verifyOtp, 
    resendOtp: authService.resendOtp,
    setToken: (token) => localStorage.setItem('texorax_token', token), 
    resetPasswordRequest: authService.resetPasswordRequest,
    resetPassword: authService.resetPassword,
    updateProfile: authService.updateProfile,
    changePassword: authService.changePassword
  },
  entities: dummyEntities
};

export default base44;