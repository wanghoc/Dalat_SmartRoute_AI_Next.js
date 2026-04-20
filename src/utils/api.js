/**
 * API Configuration utility
 * Uses NEXT_PUBLIC_API_URL environment variable if available,
 * Falls back to proxy path during development
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Helper function to make API requests with automatic base URL
 */
export const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    return fetch(url, options);
};
