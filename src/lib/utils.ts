import { clsx, type ClassValue } from 'clsx';
import type { Booking, BookingProgressStatus, CourtType } from '../types';
import { COURT_PRICE_PER_HOUR } from '../types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getTodayStr(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateBeforeToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export function isEndTimeBeforeStart(startTime: string, endTime: string): boolean {
  return endTime <= startTime;
}

export function getBookingProgressStatus(booking: Booking): BookingProgressStatus {
  const now = new Date();
  const bookingDate = new Date(booking.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  bookingDate.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    return 'ended';
  }

  if (bookingDate > today) {
    return 'upcoming';
  }

  const [startHour, startMin] = booking.startTime.split(':').map(Number);
  const [endHour, endMin] = booking.endTime.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(startHour, startMin, 0, 0);
  const endTime = new Date();
  endTime.setHours(endHour, endMin, 0, 0);

  if (now < startTime) {
    return 'upcoming';
  } else if (now >= startTime && now <= endTime) {
    return 'in_progress';
  } else {
    return 'ended';
  }
}

export function getBookingProgressBadgeClass(status: BookingProgressStatus): string {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-700';
    case 'in_progress':
      return 'bg-emerald-100 text-emerald-700';
    case 'ended':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getBookingDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const diffMinutes = Math.max(0, endMinutes - startMinutes);
  return diffMinutes / 60;
}

export function calculateBookingAmount(startTime: string, endTime: string, courtType: CourtType): number {
  const hours = getBookingDurationHours(startTime, endTime);
  const pricePerHour = COURT_PRICE_PER_HOUR[courtType] || 50;
  return Math.round(hours * pricePerHour * 100) / 100;
}

export function getLowestCourtPrice(): number {
  return Math.min(...Object.values(COURT_PRICE_PER_HOUR));
}
