import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ------- Request interceptor to add JWT token -------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // get JWT from localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------- Auth -------
export const loginAPI = (data) => API.post('/users/login', data);
export const signupAPI = (data) => API.post('/users/signup', data);

// ------- Users -------
export const getUsersAPI = () => API.get('/users');
export const addUserAPI = (data) => API.post('/users', data);
export const deleteUserAPI = (id) => API.delete(`/users/${id}`);
export const updateUserAPI = (id, data) => API.put(`/users/${id}`, data);

// ------- Assessments -------
export const getAssessmentsAPI = () => API.get('/assessments');
export const getAssessmentBySlugAPI = (slug) => API.get(`/assessments/${slug}`);
export const createAssessmentAPI = (data) =>
  API.post('/assessments', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateAssessmentAPI = (id, data) =>
  API.put(`/assessments/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteAssessmentAPI = (id) => API.delete(`/assessments/${id}`);
export const duplicateAssessmentAPI = (id) => API.post(`/assessments/${id}/duplicate`);
export const importQuestionsAPI = (slug, questions) => API.post(`/assessments/${slug}/import-questions`, { questions });

// ------- Leads -------
export const getLeadsAPI = () => API.get('/leads');
export const createLeadAPI = (data) => API.post('/leads', data);
export const updateLeadAPI = (id, data) => API.put(`/leads/${id}`, data);
export const sendLeadEmailAPI = (id, data) => API.post(`/leads/${id}/send-email`, data);

// ------- Voice Settings -------
export const getVoiceSettingsAPI = () => API.get('/voicesettings');
export const updateVoiceSettingsAPI = (data) => API.put('/voicesettings', data);

// ------- Analytics -------
export const getAnalyticsAPI = () => API.get('/analytics');

// ------- Settings -------
export const getSettingsAPI = () => API.get('/settings');
export const getSettingsByAssessmentSlugAPI = (slug) => API.get(`/settings/${slug}`);
export const updateSettingsAPI = (payload) =>
  API.put('/settings', payload, {
    headers:
      payload instanceof FormData
        ? { 'Content-Type': undefined }
        : { 'Content-Type': 'application/json' },
  });

export default API;