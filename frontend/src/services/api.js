import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const testConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/test`);
    return response.data;
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
};

export const fetchTickets = async (organizations, startDate, endDate) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/tickets`, {
      organizations,
      startDate,
      endDate,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}; 