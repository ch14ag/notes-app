import axios, { type InternalAxiosRequestConfig } from 'axios';

import type { ApiResponse } from "./types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor: Handle 401s and refresh token
api.interceptors.response.use(
  (response) => response, // Pass successful responses through
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to retry this exact request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use a fresh axios instance to avoid infinite interceptor loops
        // Note: If your refresh token is in an HTTP-only cookie, you MUST include withCredentials: true
        const { data } = await axios.post<ApiResponse>(`${import.meta.env.VITE_API_URL}/users/refresh-token`, {}, {
          withCredentials: true 
        });

        // Save the new token
        localStorage.setItem('accessToken', data.data.accessToken || "");

        // Update the header of the paused request and retry it
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // If the refresh token itself is expired or invalid, log the user out
        localStorage.removeItem('accessToken');
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;