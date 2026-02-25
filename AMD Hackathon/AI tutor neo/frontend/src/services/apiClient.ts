/**
 * API Client for MentorBoard Lite
 * 
 * Provides typed methods for communicating with the backend API.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Request Interfaces
export interface HintRequest {
  student_id: number;
  problem: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ValidationRequest {
  student_id: number;
  problem: string;
  student_step: string;
}

// Response Interfaces
export interface HintResponse {
  hint: string;
  next_question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ValidationResponse {
  correct: boolean;
  feedback: string;
}

export interface AttemptHistoryItem {
  timestamp: string;
  correct: boolean;
  problem: string;
}

export interface StatsData {
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;
  history: AttemptHistoryItem[];
}

/**
 * API Client class for MentorBoard Lite backend
 */
class MathTutorAPI {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 15000, // 15 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.code === 'ECONNABORTED') {
          return Promise.reject({
            message: 'Request timed out. Please try again.',
            isTimeout: true,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get AI-powered hint for a math problem
   */
  async getHint(request: HintRequest): Promise<HintResponse> {
    try {
      const response = await this.axiosInstance.post<HintResponse>('/hint', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate a student's solution step
   */
  async checkStep(request: ValidationRequest): Promise<ValidationResponse> {
    try {
      const response = await this.axiosInstance.post<ValidationResponse>('/check', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get student statistics and history
   */
  async getStats(studentId: number): Promise<StatsData> {
    try {
      const response = await this.axiosInstance.get<StatsData>(`/stats/${studentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      
      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status;
        const detail = axiosError.response.data?.detail;
        
        switch (status) {
          case 400:
            return new Error(detail || 'Invalid input. Please check your math expression.');
          case 404:
            return new Error('Student not found.');
          case 422:
            return new Error('Please check your input and try again.');
          case 500:
            return new Error('Something went wrong. Please try again later.');
          case 503:
            return new Error(detail || 'The AI service is temporarily unavailable. Please try again in a moment.');
          default:
            return new Error(detail || 'An unexpected error occurred.');
        }
      } else if (axiosError.request) {
        // Request made but no response received
        return new Error('Unable to connect to the server. Please check your connection.');
      }
    }
    
    // Unknown error
    return new Error('An unexpected error occurred. Please try again.');
  }
}

// Export singleton instance
export const apiClient = new MathTutorAPI();
