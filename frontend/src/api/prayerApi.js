import axios from 'axios';

const API = 'http://localhost:5000/api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`
});

// Public
export const getRequests = (page=1) =>
  axios.get(`${API}/prayer-requests?page=${page}`).then(r=>r.data);

export const searchRequests = (params) =>
  axios.get(`${API}/prayer-requests/search`, {params}).then(r=>r.data);

export const getFullRequest = (id) =>
  axios.get(`${API}/prayer-requests/${id}/full`).then(r=>r.data);

export const incrementPray = (id) =>
  axios.post(`${API}/prayer-requests/${id}/pray`).then(r=>r.data);

export const getComments = (id) =>
  axios.get(`${API}/prayer-requests/${id}/comments`).then(r=>r.data);

export const submitComment = (id, data) =>
  axios.post(`${API}/prayer-requests/${id}/comments`, data).then(r=>r.data);

// Admin
export const adminLogin = (creds) =>
  axios.post(`${API}/admin/login`, creds).then(r=>r.data);

export const adminGetRequests = () =>
  axios.get(`${API}/admin/requests`, {headers: authHeader()}).then(r=>r.data);

export const adminAddRequest = (data) =>
  axios.post(`${API}/admin/requests`, data, {headers: authHeader()}).then(r=>r.data);

export const adminEditRequest = (id,data) =>
  axios.put(`${API}/admin/requests/${id}`, data, {headers: authHeader()}).then(r=>r.data);

export const adminDeleteRequest = (id) =>
  axios.delete(`${API}/admin/requests/${id}`, {headers: authHeader()}).then(r=>r.data);

export const adminGetComments = (status='pending') =>
  axios.get(`${API}/admin/comments?status=${status}`, {headers: authHeader()}).then(r=>r.data);

export const adminApproveComment = (id) =>
  axios.put(`${API}/admin/comments/${id}/approve`, {}, {headers: authHeader()}).then(r=>r.data);

export const adminRejectComment = (id) =>
  axios.put(`${API}/admin/comments/${id}/reject`, {}, {headers: authHeader()}).then(r=>r.data);