import type { Court, Booking, Inspection } from '../types';

const COURTS_KEY = 'badminton_courts';
const BOOKINGS_KEY = 'badminton_bookings';
const INSPECTIONS_KEY = 'badminton_inspections';

function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Courts
export const getCourts = (): Court[] => getFromStorage<Court>(COURTS_KEY);

export const saveCourts = (courts: Court[]): void => saveToStorage(COURTS_KEY, courts);

export const addCourt = (court: Omit<Court, 'id' | 'createdAt'>): Court => {
  const courts = getCourts();
  const newCourt: Court = {
    ...court,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  courts.push(newCourt);
  saveCourts(courts);
  return newCourt;
};

export const updateCourt = (id: string, updates: Partial<Court>): Court | null => {
  const courts = getCourts();
  const index = courts.findIndex((c) => c.id === id);
  if (index === -1) return null;
  courts[index] = { ...courts[index], ...updates };
  saveCourts(courts);
  return courts[index];
};

export const deleteCourt = (id: string): boolean => {
  const courts = getCourts();
  const filtered = courts.filter((c) => c.id !== id);
  if (filtered.length === courts.length) return false;
  saveCourts(filtered);
  return true;
};

export const isCourtCodeDuplicate = (code: string, excludeId?: string): boolean => {
  const courts = getCourts();
  return courts.some((c) => c.code === code && c.id !== excludeId);
};

// Bookings
export const getBookings = (): Booking[] => getFromStorage<Booking>(BOOKINGS_KEY);

export const saveBookings = (bookings: Booking[]): void => saveToStorage(BOOKINGS_KEY, bookings);

export const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>): Booking => {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  saveBookings(bookings);
  return newBooking;
};

export const deleteBooking = (id: string): boolean => {
  const bookings = getBookings();
  const filtered = bookings.filter((b) => b.id !== id);
  if (filtered.length === bookings.length) return false;
  saveBookings(filtered);
  return true;
};

export const getBookingsByCourt = (courtId: string): Booking[] => {
  return getBookings().filter((b) => b.courtId === courtId);
};

// Inspections
export const getInspections = (): Inspection[] => getFromStorage<Inspection>(INSPECTIONS_KEY);

export const saveInspections = (inspections: Inspection[]): void =>
  saveToStorage(INSPECTIONS_KEY, inspections);

export const addInspection = (inspection: Omit<Inspection, 'id'>): Inspection => {
  const inspections = getInspections();
  const newInspection: Inspection = {
    ...inspection,
    id: generateId(),
  };
  inspections.push(newInspection);
  saveInspections(inspections);
  return newInspection;
};

export const updateInspection = (id: string, updates: Partial<Inspection>): Inspection | null => {
  const inspections = getInspections();
  const index = inspections.findIndex((i) => i.id === id);
  if (index === -1) return null;
  inspections[index] = { ...inspections[index], ...updates };
  saveInspections(inspections);
  return inspections[index];
};

export const deleteInspection = (id: string): boolean => {
  const inspections = getInspections();
  const filtered = inspections.filter((i) => i.id !== id);
  if (filtered.length === inspections.length) return false;
  saveInspections(filtered);
  return true;
};

export const getInspectionsByCourt = (courtId: string): Inspection[] => {
  return getInspections().filter((i) => i.courtId === courtId);
};

// Initialize with sample data if empty
export const initSampleData = (): void => {
  if (getCourts().length === 0) {
    const sampleCourts: Court[] = [
      {
        id: generateId(),
        code: 'C001',
        name: '1号场地',
        type: 'standard',
        zone: 'A区',
        bookingStatus: 'idle',
        lightingStatus: 'normal',
        floorStatus: 'normal',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        code: 'C002',
        name: '2号场地',
        type: 'standard',
        zone: 'A区',
        bookingStatus: 'booked',
        lightingStatus: 'normal',
        floorStatus: 'warning',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        code: 'C003',
        name: '3号场地',
        type: 'vip',
        zone: 'B区',
        bookingStatus: 'in_use',
        lightingStatus: 'normal',
        floorStatus: 'normal',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        code: 'C004',
        name: '4号场地',
        type: 'vip',
        zone: 'B区',
        bookingStatus: 'idle',
        lightingStatus: 'error',
        floorStatus: 'normal',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        code: 'C005',
        name: '5号场地',
        type: 'training',
        zone: 'C区',
        bookingStatus: 'disabled',
        lightingStatus: 'normal',
        floorStatus: 'error',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        code: 'C006',
        name: '6号场地',
        type: 'competition',
        zone: 'C区',
        bookingStatus: 'idle',
        lightingStatus: 'normal',
        floorStatus: 'normal',
        createdAt: new Date().toISOString(),
      },
    ];
    saveCourts(sampleCourts);
  }
};
