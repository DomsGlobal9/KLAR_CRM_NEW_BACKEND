import { Response } from 'express';
import { ApiResponse } from '../interfaces/stage.interface';

export const sendResponse = (
  res: Response,
  statusCode: number,
  data: ApiResponse<any>
): void => {
  res.status(statusCode).json(data);
};

export const generateId = (prefix: string = 'STAGE'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const validateColor = (color: string): boolean => {
  const validColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-yellow-500 to-yellow-600',
    'from-orange-500 to-orange-600',
    'from-red-500 to-red-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-emerald-500 to-emerald-600'
  ];
  
  return validColors.includes(color);
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};