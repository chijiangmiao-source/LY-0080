import type {
  Court,
  Booking,
  Inspection,
  BookingChange,
  Member,
  MemberTransaction,
  TransactionType,
  MemberPackage,
  PackageType,
  PackageDeductionDetail,
  BookingSettleDetails,
  CourtType,
} from '../types';
import {
  getBookingProgressStatus,
  getTodayStr,
  calculateBookingAmount,
  getLowestCourtPrice,
  getBookingDurationHours,
} from './utils';

const COURTS_KEY = 'badminton_courts';
const BOOKINGS_KEY = 'badminton_bookings';
const INSPECTIONS_KEY = 'badminton_inspections';
const MEMBERS_KEY = 'badminton_members';
const MEMBER_TRANSACTIONS_KEY = 'badminton_member_transactions';
const MEMBER_PACKAGES_KEY = 'badminton_member_packages';

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
  relatedPackageId?: string;
  packageDeductions?: PackageDeductionDetail[];
  balanceDeduction?: number;
}

export const createMemberTransaction = (
  params: CreateTransactionParams
): { success: boolean; message?: string; transaction?: MemberTransaction } => {
  const {
    memberId,
    type,
    amount = 0,
    hours = 0,
    remark,
    relatedBookingId,
    relatedPackageId,
    packageDeductions,
    balanceDeduction,
  } = params;
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
    case 'package_purchase':
    case 'package_deduct':
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
    relatedPackageId,
    packageDeductions,
    balanceDeduction,
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
  settleDetails?: BookingSettleDetails;
}

// ==================== Member Packages ====================

export const getMemberPackages = (): MemberPackage[] =>
  getFromStorage<MemberPackage>(MEMBER_PACKAGES_KEY);

export const saveMemberPackages = (packages: MemberPackage[]): void =>
  saveToStorage(MEMBER_PACKAGES_KEY, packages);

export const getPackagesByMember = (memberId: string): MemberPackage[] => {
  return getMemberPackages().filter((p) => p.memberId === memberId);
};

export const getPackageById = (id: string): MemberPackage | undefined => {
  return getMemberPackages().find((p) => p.id === id);
};

export const getPackageStatus = (pkg: MemberPackage): 'active' | 'expired' | 'depleted' => {
  const today = getTodayStr();
  if (pkg.validTo < today) return 'expired';
  const remainingCount = pkg.totalCount - pkg.usedCount;
  const remainingHours = pkg.totalHours - pkg.usedHours;
  if (
    (pkg.type === 'count' && remainingCount <= 0) ||
    (pkg.type === 'hourly' && remainingHours <= 0) ||
    (pkg.type === 'time_slot' && remainingCount <= 0 && remainingHours <= 0)
  ) {
    return 'depleted';
  }
  return 'active';
};

export const isPackageApplicable = (
  pkg: MemberPackage,
  courtType: CourtType,
  date: string,
  startTime: string,
  endTime: string
): boolean => {
  if (getPackageStatus(pkg) !== 'active') return false;
  if (pkg.validFrom > date || pkg.validTo < date) return false;
  if (pkg.applicableCourtTypes.length > 0 && !pkg.applicableCourtTypes.includes(courtType)) {
    return false;
  }
  if (pkg.applicableTimeSlots.length > 0) {
    const bookingStartMinutes = timeToMinutes(startTime);
    const bookingEndMinutes = timeToMinutes(endTime);
    const fitsInSlot = pkg.applicableTimeSlots.some((slot) => {
      const [slotStart, slotEnd] = slot.split('-');
      const slotStartMin = timeToMinutes(slotStart);
      const slotEndMin = timeToMinutes(slotEnd);
      return bookingStartMinutes >= slotStartMin && bookingEndMinutes <= slotEndMin;
    });
    if (!fitsInSlot) return false;
  }
  return true;
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

interface NewPackageInput {
  memberId: string;
  name: string;
  type: PackageType;
  totalCount: number;
  totalHours: number;
  applicableCourtTypes: CourtType[];
  applicableTimeSlots: string[];
  validFrom: string;
  validTo: string;
}

export const addMemberPackage = (input: NewPackageInput): MemberPackage => {
  const packages = getMemberPackages();
  const newPackage: MemberPackage = {
    ...input,
    usedCount: 0,
    usedHours: 0,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  packages.push(newPackage);
  saveMemberPackages(packages);

  const purchaseAmount = 0;
  createMemberTransaction({
    memberId: input.memberId,
    type: 'package_purchase',
    amount: purchaseAmount,
    remark: `开通套餐：${input.name}`,
    relatedPackageId: newPackage.id,
  });

  return newPackage;
};

export const updateMemberPackage = (
  id: string,
  updates: Partial<MemberPackage>
): MemberPackage | null => {
  const packages = getMemberPackages();
  const index = packages.findIndex((p) => p.id === id);
  if (index === -1) return null;
  packages[index] = { ...packages[index], ...updates };
  saveMemberPackages(packages);
  return packages[index];
};

export const deleteMemberPackage = (id: string): boolean => {
  const packages = getMemberPackages();
  const filtered = packages.filter((p) => p.id !== id);
  if (filtered.length === packages.length) return false;
  saveMemberPackages(filtered);
  return true;
};

// ==================== Package Deduction Logic ====================

export interface DeductionPreview {
  packageDeductions: PackageDeductionDetail[];
  balanceDeduction: number;
  totalAmount: number;
  remainingCountNeed: number;
  remainingHoursNeed: number;
}

export const previewBookingDeduction = (
  memberId: string,
  courtType: CourtType,
  date: string,
  startTime: string,
  endTime: string
): DeductionPreview => {
  const totalAmount = calculateBookingAmount(startTime, endTime, courtType);
  const durationHours = getBookingDurationHours(startTime, endTime);

  const result: DeductionPreview = {
    packageDeductions: [],
    balanceDeduction: 0,
    totalAmount,
    remainingCountNeed: 1,
    remainingHoursNeed: durationHours,
  };

  const member = getMemberById(memberId);
  if (!member) {
    result.balanceDeduction = totalAmount;
    return result;
  }

  const packages = getPackagesByMember(memberId)
    .filter((p) => isPackageApplicable(p, courtType, date, startTime, endTime))
    .sort((a, b) => {
      const typeOrder: Record<PackageType, number> = { time_slot: 0, count: 1, hourly: 2 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return new Date(a.validTo).getTime() - new Date(b.validTo).getTime();
    });

  let amountCovered = 0;

  for (const pkg of packages) {
    const remainingCount = pkg.totalCount - pkg.usedCount;
    const remainingHours = pkg.totalHours - pkg.usedHours;
    let deductCount = 0;
    let deductHours = 0;

    if (pkg.type === 'count' && remainingCount > 0 && result.remainingCountNeed > 0) {
      deductCount = Math.min(remainingCount, result.remainingCountNeed);
      result.remainingCountNeed -= deductCount;
      const pkgAmount = (deductCount / 1) * totalAmount;
      amountCovered += pkgAmount;
      result.packageDeductions.push({
        packageId: pkg.id,
        packageName: pkg.name,
        packageType: pkg.type,
        deductedCount: deductCount,
        deductedHours: 0,
        deductedAmount: Math.round(pkgAmount * 100) / 100,
      });
    } else if (pkg.type === 'hourly' && remainingHours > 0 && result.remainingHoursNeed > 0) {
      deductHours = Math.min(remainingHours, result.remainingHoursNeed);
      result.remainingHoursNeed -= deductHours;
      const pricePerHour = totalAmount / durationHours;
      const pkgAmount = deductHours * pricePerHour;
      amountCovered += pkgAmount;
      result.packageDeductions.push({
        packageId: pkg.id,
        packageName: pkg.name,
        packageType: pkg.type,
        deductedCount: 0,
        deductedHours: deductHours,
        deductedAmount: Math.round(pkgAmount * 100) / 100,
      });
    } else if (pkg.type === 'time_slot' && (remainingCount > 0 || remainingHours > 0)) {
      if (remainingCount > 0 && result.remainingCountNeed > 0) {
        deductCount = Math.min(remainingCount, result.remainingCountNeed);
        result.remainingCountNeed -= deductCount;
      }
      if (remainingHours > 0 && result.remainingHoursNeed > 0) {
        deductHours = Math.min(remainingHours, result.remainingHoursNeed);
        result.remainingHoursNeed -= deductHours;
      }
      if (deductCount > 0 || deductHours > 0) {
        const pkgAmount = totalAmount;
        amountCovered += pkgAmount;
        result.packageDeductions.push({
          packageId: pkg.id,
          packageName: pkg.name,
          packageType: pkg.type,
          deductedCount: deductCount,
          deductedHours: deductHours,
          deductedAmount: Math.round(pkgAmount * 100) / 100,
        });
      }
    }

    if (result.remainingCountNeed <= 0 && result.remainingHoursNeed <= 0) {
      break;
    }
  }

  result.balanceDeduction = Math.round((totalAmount - amountCovered) * 100) / 100;
  if (result.balanceDeduction < 0) result.balanceDeduction = 0;

  return result;
};

const applyPackageDeductions = (
  _memberId: string,
  deductions: PackageDeductionDetail[]
): void => {
  const packages = getMemberPackages();
  deductions.forEach((detail) => {
    const idx = packages.findIndex((p) => p.id === detail.packageId);
    if (idx !== -1) {
      packages[idx] = {
        ...packages[idx],
        usedCount: packages[idx].usedCount + detail.deductedCount,
        usedHours: packages[idx].usedHours + detail.deductedHours,
      };
    }
  });
  saveMemberPackages(packages);
};

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

  const totalAmount = calculateBookingAmount(booking.startTime, booking.endTime, court.type);
  let settleDetails: BookingSettleDetails = {
    packageDeductions: [],
    balanceDeduction: totalAmount,
    totalAmount,
  };

  if (booking.memberId) {
    const preview = previewBookingDeduction(
      booking.memberId,
      court.type,
      booking.date,
      booking.startTime,
      booking.endTime
    );
    settleDetails = {
      packageDeductions: preview.packageDeductions,
      balanceDeduction: preview.balanceDeduction,
      totalAmount,
    };

    if (preview.packageDeductions.length > 0) {
      applyPackageDeductions(booking.memberId, preview.packageDeductions);
    }

    if (settleDetails.balanceDeduction > 0) {
      const member = getMemberById(booking.memberId);
      if (!member || member.balance < settleDetails.balanceDeduction) {
        return { success: false, message: `余额不足，还需 ¥${settleDetails.balanceDeduction.toFixed(2)}` };
      }
      const txResult = createMemberTransaction({
        memberId: booking.memberId,
        type: 'consume',
        amount: settleDetails.balanceDeduction,
        remark: `${court.name}消费 ${booking.startTime}-${booking.endTime}${
          preview.packageDeductions.length > 0 ? '（套餐抵扣后余额补扣）' : ''
        }`,
        relatedBookingId: booking.id,
        packageDeductions: preview.packageDeductions,
        balanceDeduction: settleDetails.balanceDeduction,
      });
      if (!txResult.success) {
        return { success: false, message: txResult.message };
      }
    }

    if (preview.packageDeductions.length > 0) {
      const totalPackageAmount = preview.packageDeductions.reduce(
        (sum, d) => sum + d.deductedAmount,
        0
      );
      createMemberTransaction({
        memberId: booking.memberId,
        type: 'package_deduct',
        amount: totalPackageAmount,
        remark: `${court.name}消费套餐抵扣 ${booking.startTime}-${booking.endTime}`,
        relatedBookingId: booking.id,
        packageDeductions: preview.packageDeductions,
        balanceDeduction: 0,
      });
    }
  }

  bookings[bookingIndex] = {
    ...booking,
    settled: true,
    settledAt: new Date().toISOString(),
    settledAmount: totalAmount,
    settleDetails,
  };
  saveBookings(bookings);

  return { success: true, amount: totalAmount, settleDetails };
};

// ==================== Package Statistics ====================

export const getTodayPackageConsumption = (memberId?: string) => {
  const today = getTodayStr();
  const transactions = getMemberTransactions().filter((t) => {
    const txDate = new Date(t.createdAt).toISOString().split('T')[0];
    if (txDate !== today) return false;
    if (t.type !== 'package_deduct') return false;
    if (memberId && t.memberId !== memberId) return false;
    return true;
  });

  let totalCount = 0;
  let totalHours = 0;
  let totalAmount = 0;

  transactions.forEach((t) => {
    t.packageDeductions?.forEach((d) => {
      totalCount += d.deductedCount;
      totalHours += d.deductedHours;
      totalAmount += d.deductedAmount;
    });
  });

  return { totalCount, totalHours: Math.round(totalHours * 100) / 100, totalAmount };
};

export const getTodayBalanceSupplement = (memberId?: string): number => {
  const today = getTodayStr();
  return getMemberTransactions()
    .filter((t) => {
      const txDate = new Date(t.createdAt).toISOString().split('T')[0];
      if (txDate !== today) return false;
      if (t.type !== 'consume') return false;
      if (!t.packageDeductions || t.packageDeductions.length === 0) return false;
      if (memberId && t.memberId !== memberId) return false;
      return true;
    })
    .reduce((sum, t) => sum + (t.balanceDeduction || 0), 0);
};

export const getExpiringPackagesCount = (days: number = 7): number => {
  const today = new Date();
  const threshold = new Date(today);
  threshold.setDate(today.getDate() + days);
  const thresholdStr = threshold.toISOString().split('T')[0];
  const todayStr = getTodayStr();

  return getMemberPackages().filter((p) => {
    if (getPackageStatus(p) !== 'active') return false;
    return p.validTo >= todayStr && p.validTo <= thresholdStr;
  }).length;
};

export const getMemberExpiringPackages = (memberId: string, days: number = 7): MemberPackage[] => {
  const today = new Date();
  const threshold = new Date(today);
  threshold.setDate(today.getDate() + days);
  const thresholdStr = threshold.toISOString().split('T')[0];
  const todayStr = getTodayStr();

  return getPackagesByMember(memberId).filter((p) => {
    if (getPackageStatus(p) !== 'active') return false;
    return p.validTo >= todayStr && p.validTo <= thresholdStr;
  });
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

  let memberIds: string[] = [];
  if (getMembers().length === 0) {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();
    const id4 = generateId();
    memberIds = [id1, id2, id3, id4];
    const sampleMembers: Member[] = [
      {
        id: id1,
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
        id: id2,
        name: '李四',
        phone: '13800138002',
        level: 'silver',
        balance: 200,
        giftHours: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
      },
      {
        id: id3,
        name: '王五',
        phone: '13800138003',
        level: 'diamond',
        balance: 0,
        giftHours: 10,
        createdAt: new Date().toISOString(),
        status: 'active',
      },
      {
        id: id4,
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
  } else {
    memberIds = getMembers().map((m) => m.id);
  }

  if (getMemberPackages().length === 0 && memberIds.length >= 2) {
    const today = new Date();
    const validFrom = getTodayStr();
    const validToDate = new Date(today);
    validToDate.setDate(today.getDate() + 30);
    const validTo = validToDate.toISOString().split('T')[0];
    const expiringDate = new Date(today);
    expiringDate.setDate(today.getDate() + 3);
    const expiringTo = expiringDate.toISOString().split('T')[0];

    const samplePackages: MemberPackage[] = [
      {
        id: generateId(),
        memberId: memberIds[0],
        name: '标准场10次卡',
        type: 'count',
        totalCount: 10,
        usedCount: 3,
        totalHours: 0,
        usedHours: 0,
        applicableCourtTypes: ['standard'],
        applicableTimeSlots: [],
        validFrom,
        validTo,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        memberId: memberIds[0],
        name: '黄金时段20小时卡',
        type: 'hourly',
        totalCount: 0,
        usedCount: 0,
        totalHours: 20,
        usedHours: 5,
        applicableCourtTypes: ['standard', 'vip'],
        applicableTimeSlots: ['18:00-22:00'],
        validFrom,
        validTo: expiringTo,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        memberId: memberIds[1],
        name: '晨练时段套餐',
        type: 'time_slot',
        totalCount: 20,
        usedCount: 8,
        totalHours: 40,
        usedHours: 16,
        applicableCourtTypes: ['standard', 'training'],
        applicableTimeSlots: ['06:00-10:00'],
        validFrom,
        validTo,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        memberId: memberIds[2],
        name: 'VIP畅打50小时卡',
        type: 'hourly',
        totalCount: 0,
        usedCount: 0,
        totalHours: 50,
        usedHours: 12,
        applicableCourtTypes: ['vip', 'competition'],
        applicableTimeSlots: [],
        validFrom,
        validTo,
        createdAt: new Date().toISOString(),
      },
    ];
    saveMemberPackages(samplePackages);
  }
};
