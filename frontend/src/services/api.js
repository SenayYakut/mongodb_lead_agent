/** API service for backend communication */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't set Content-Type for multipart/form-data - let browser set it with boundary
});

/**
 * Submit a new meeting for processing
 */
export const submitMeeting = async (text, location = null, audioBlob = null, photos = []) => {
  try {
    const formData = new FormData();
    
    // Add text if provided
    if (text) {
      formData.append('text', text);
    }
    
    // Add location if provided
    if (location) {
      formData.append('location', location);
    }
    
    // Add audio file if recorded
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.webm');
    }
    
    // Add photo files
    photos.forEach((photo, index) => {
      formData.append('photos', photo.file, `photo_${index}.jpg`);
    });
    
    // For FormData, axios will automatically set Content-Type with boundary
    const response = await api.post('/api/meetings', formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting meeting:', error);
    throw error;
  }
};

/**
 * Get all meetings grouped by priority (P0, P1, P2)
 */
export const getGroups = async () => {
  try {
    const response = await api.get('/api/groups');
    return response.data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};

export default api;
