import type { Court, Booking, Inspection, BookingChange, Member, MemberTransaction, TransactionType } from '../types';
import { getBookingProgressStatus, getTodayStr, calculateBookingAmount, getLowestCourtPrice } from './utils';

const COURTS_KEY = 'badminton_courts';
const BOOKINGS_KEY = 'badminton_bookings';
const INSPECTIONS_KEY = 'badminton_inspections';
const MEMBERS_KEY = 'badminton_members';
const MEMBER_TRANSACTIONS_KEY = 'badminton_member_transactions';

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

export const isTimeSlotConflict = (
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): boolean => {
  const bookings = getBookings();
  return bookings.some((b) => {
    if (b.id === excludeBookingId) return false;
    if (b.courtId !== courtId || b.date !== date) return false;
    return !(endTime <= b.startTime || startTime >= b.endTime);
  });
};

export const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>): Booking => {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  saveBookings(bookings);
  syncCourtStatusAfterBookingChange(booking.courtId);
  return newBooking;
};

export const updateBooking = (
  id: string,
  updates: { date: string; startTime: string; endTime: string }
): Booking | null => {
  const bookings = getBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const originalBooking = bookings[index];
  const changeRecord: BookingChange = {
    id: generateId(),
    previousDate: originalBooking.date,
    previousStartTime: originalBooking.startTime,
    previousEndTime: originalBooking.endTime,
    newDate: updates.date,
    newStartTime: updates.startTime,
    newEndTime: updates.endTime,
    changedAt: new Date().toISOString(),
  };

  const existingHistory = originalBooking.changeHistory || [];
  bookings[index] = {
    ...originalBooking,
    date: updates.date,
    startTime: updates.startTime,
    endTime: updates.endTime,
    changeHistory: [...existingHistory, changeRecord],
  };
  saveBookings(bookings);

  syncCourtStatusAfterBookingChange(originalBooking.courtId);
  if (bookings[index].courtId !== originalBooking.courtId) {
    syncCourtStatusAfterBookingChange(bookings[index].courtId);
  }

  return bookings[index];
};

export const deleteBooking = (id: string): boolean => {
  const bookings = getBookings();
  const bookingToDelete = bookings.find((b) => b.id === id);
  const filtered = bookings.filter((b) => b.id !== id);
  if (filtered.length === bookings.length) return false;
  saveBookings(filtered);
  if (bookingToDelete) {
    syncCourtStatusAfterBookingChange(bookingToDelete.courtId);
  }
  return true;
};

export const getBookingsByCourt = (courtId: string): Booking[] => {
  return getBookings().filter((b) => b.courtId === courtId);
};

export const determineCourtBookingStatus = (courtId: string): 'idle' | 'booked' | 'in_use' => {
  const courtBookings = getBookingsByCourt(courtId);
  const activeBookings = courtBookings.filter((b) => {
    const status = getBookingProgressStatus(b);
    return status === 'upcoming' || status === 'in_progress';
  });

  if (activeBookings.length === 0) {
    return 'idle';
  }

  const hasInProgress = courtBookings.some((b) => getBookingProgressStatus(b) === 'in_progress');
  return hasInProgress ? 'in_use' : 'booked';
};

const syncCourtStatusAfterBookingChange = (courtId: string): void => {
  const courts = getCourts();
  const court = courts.find((c) => c.id === courtId);
  if (!court || court.bookingStatus === 'disabled') return;

  const newStatus = determineCourtBookingStatus(courtId);
  if (court.bookingStatus !== newStatus) {
    updateCourt(courtId, { bookingStatus: newStatus });
  }
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

// Members
export const getMembers = (): Member[] => getFromStorage<Member>(MEMBERS_KEY);

export const saveMembers = (members: Member[]): void => saveToStorage(MEMBERS_KEY, members);

export const addMember = (member: Omit<Member, 'id' | 'balance' | 'giftHours'>): Member => {
  const members = getMembers();
  const newMember: Member = {
    ...member,
    id: generateId(),
    balance: 0,
    giftHours: 0,
    createdAt: member.createdAt || new Date().toISOString(),
  };
  members.push(newMember);
  saveMembers(members);
  return newMember;
};

export const updateMember = (id: string, updates: Partial<Member>): Member | null => {
  const members = getMembers();
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) return null;
  members[index] = { ...members[index], ...updates };
  saveMembers(members);
  return members[index];
};

export const deleteMember = (id: string): boolean => {
  const members = getMembers();
  const filtered = members.filter((m) => m.id !== id);
  if (filtered.length === members.length) return false;
  saveMembers(filtered);

  const bookings = getBookings();
  const filteredBookings = bookings.filter((b) => b.memberId !== id);
  if (filteredBookings.length !== bookings.length) {
    saveBookings(filteredBookings);
  }
  return true;
};

export const getMemberById = (id: string): Member | undefined => {
  return getMembers().find((m) => m.id === id);
};

export const getMemberByPhone = (phone: string): Member | undefined => {
  return getMembers().find((m) => m.phone === phone);
};

export const isMemberPhoneDuplicate = (phone: string, excludeId?: string): boolean => {
  const members = getMembers();
  return members.some((m) => m.phone === phone && m.id !== excludeId);
};

// Member Transactions
export const getMemberTransactions = (): MemberTransaction[] =>
  getFromStorage<MemberTransaction>(MEMBER_TRANSACTIONS_KEY);

export const saveMemberTransactions = (transactions: MemberTransaction[]): void =>
  saveToStorage(MEMBER_TRANSACTIONS_KEY, transactions);

export const getTransactionsByMember = (memberId: string): MemberTransaction[] => {
  return getMemberTransactions().filter((t) => t.memberId === memberId);
};

interface CreateTransactionParams {
  memberId: string;
  type: TransactionType;
  amount?: number;
  hours?: number;
  remark?: string;
  relatedBookingId?: string;
}

export const createMemberTransaction = (
  params: CreateTransactionParams
): { success: boolean; message?: string; transaction?: MemberTransaction } => {
  const { memberId, type, amount = 0, hours = 0, remark, relatedBookingId } = params;
  const members = getMembers();
  const memberIndex = members.findIndex((m) => m.id === memberId);

  if (memberIndex === -1) {
    return { success: false, message: '会员不存在' };
  }

  const member = members[memberIndex];
  if (member.status !== 'active') {
    return { success: false, message: '会员状态异常，无法进行交易' };
  }

  const beforeBalance = member.balance;
  const beforeHours = member.giftHours;
  let afterBalance = beforeBalance;
  let afterHours = beforeHours;

  switch (type) {
    case 'recharge':
    case 'refund':
    case 'gift_amount':
      afterBalance = beforeBalance + Math.abs(amount);
      break;
    case 'gift_hours':
      afterHours = beforeHours + Math.abs(hours);
      break;
    case 'deduct':
    case 'consume':
      if (beforeBalance < amount) {
        return { success: false, message: '会员余额不足' };
      }
      afterBalance = beforeBalance - amount;
      break;
  }

  const transactions = getMemberTransactions();
  const transaction: MemberTransaction = {
    id: generateId(),
    memberId,
    type,
    amount: Math.abs(amount),
    hours: Math.abs(hours),
    beforeBalance,
    afterBalance,
    beforeHours,
    afterHours,
    remark,
    relatedBookingId,
    createdAt: new Date().toISOString(),
  };
  transactions.push(transaction);
  saveMemberTransactions(transactions);

  members[memberIndex] = {
    ...member,
    balance: afterBalance,
    giftHours: afterHours,
  };
  saveMembers(members);

  return { success: true, transaction };
};

export const getTodayRechargeAmount = (): number => {
  const today = getTodayStr();
  const transactions = getMemberTransactions();
  return transactions
    .filter((t) => {
      const txDate = new Date(t.createdAt).toISOString().split('T')[0];
      return txDate === today && t.type === 'recharge';
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

export const getTodayConsumeAmount = (): number => {
  const today = getTodayStr();
  const transactions = getMemberTransactions();
  return transactions
    .filter((t) => {
      const txDate = new Date(t.createdAt).toISOString().split('T')[0];
      return txDate === today && (t.type === 'consume' || t.type === 'deduct');
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

export const getLowBalanceMemberCount = (threshold?: number): number => {
  const lowThreshold = threshold ?? getLowestCourtPrice();
  return getMembers().filter((m) => m.balance < lowThreshold && m.status === 'active').length;
};

export interface SettleBookingResult {
  success: boolean;
  message?: string;
  amount?: number;
}

export const settleBooking = (bookingId: string): SettleBookingResult => {
  const bookings = getBookings();
  const bookingIndex = bookings.findIndex((b) => b.id === bookingId);

  if (bookingIndex === -1) {
    return { success: false, message: '预订不存在' };
  }

  const booking = bookings[bookingIndex];
  if (booking.settled) {
    return { success: false, message: '该预订已结算' };
  }

  const courts = getCourts();
  const court = courts.find((c) => c.id === booking.courtId);
  if (!court) {
    return { success: false, message: '场地不存在' };
  }

  const amount = calculateBookingAmount(booking.startTime, booking.endTime, court.type);

  if (booking.memberId) {
    const txResult = createMemberTransaction({
      memberId: booking.memberId,
      type: 'consume',
      amount,
      remark: `${court.name}消费 ${booking.startTime}-${booking.endTime}`,
      relatedBookingId: booking.id,
    });
    if (!txResult.success) {
      return { success: false, message: txResult.message };
    }
  }

  bookings[bookingIndex] = {
    ...booking,
    settled: true,
    settledAt: new Date().toISOString(),
    settledAmount: amount,
  };
  saveBookings(bookings);

  return { success: true, amount };
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

  if (getMembers().length === 0) {
    const sampleMembers: Member[] = [
      {
        id: generateId(),
        name: '张三',
        phone: '13800138001',
        level: 'gold',
        balance: 500,
        giftHours: 2,
        createdAt: new Date().toISOString(),
        status: 'active',
        note: '黄金会员',
      },
      {
        id: generateId(),
        name: '李四',
        phone: '13800138002',
        level: 'silver',
        balance: 200,
        giftHours: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
      },
      {
        id: generateId(),
        name: '王五',
        phone: '13800138003',
        level: 'diamond',
        balance: 0,
        giftHours: 10,
        createdAt: new Date().toISOString(),
        status: 'active',
      },
      {
        id: generateId(),
        name: '赵六',
        phone: '13800138004',
        level: 'normal',
        balance: 50,
        giftHours: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    ];
    saveMembers(sampleMembers);
  }
};
