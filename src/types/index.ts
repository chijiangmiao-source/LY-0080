export type BookingStatus = 'idle' | 'booked' | 'in_use' | 'disabled';
export type EquipmentStatus = 'normal' | 'warning' | 'error';
export type CourtType = 'standard' | 'vip' | 'training' | 'competition';
export type InspectionStatus = 'pending' | 'processing' | 'resolved';
export type ProblemType = 'lighting' | 'floor' | 'net' | 'equipment' | 'other';
export type BookingProgressStatus = 'upcoming' | 'in_progress' | 'ended';
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';
export type MemberStatus = 'active' | 'inactive' | 'frozen';
export type TransactionType = 'recharge' | 'deduct' | 'refund' | 'gift_hours' | 'gift_amount' | 'consume' | 'package_purchase' | 'package_deduct';
export type PackageType = 'count' | 'hourly' | 'time_slot';
export type PackageStatus = 'active' | 'expired' | 'depleted';

export interface Court {
  id: string;
  code: string;
  name: string;
  type: CourtType;
  zone: string;
  bookingStatus: BookingStatus;
  lightingStatus: EquipmentStatus;
  floorStatus: EquipmentStatus;
  createdAt: string;
}

export interface BookingChange {
  id: string;
  previousDate: string;
  previousStartTime: string;
  previousEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  changedAt: string;
}

export interface Booking {
  id: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  memberId?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt: string;
  changeHistory?: BookingChange[];
  settled?: boolean;
  settledAt?: string;
  settledAmount?: number;
  settleDetails?: BookingSettleDetails;
}

export const COURT_PRICE_PER_HOUR: Record<CourtType, number> = {
  standard: 50,
  vip: 100,
  training: 40,
  competition: 150,
};

export interface Inspection {
  id: string;
  courtId: string;
  date: string;
  inspector: string;
  problemType: ProblemType;
  status: InspectionStatus;
  notes: string;
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  idle: '空闲',
  booked: '已预订',
  in_use: '使用中',
  disabled: '停用',
};

export const BOOKING_PROGRESS_STATUS_LABEL: Record<BookingProgressStatus, string> = {
  upcoming: '即将开始',
  in_progress: '进行中',
  ended: '已结束',
};

export const COURT_TYPE_LABEL: Record<CourtType, string> = {
  standard: '标准场',
  vip: 'VIP场',
  training: '训练馆',
  competition: '比赛馆',
};

export const EQUIPMENT_STATUS_LABEL: Record<EquipmentStatus, string> = {
  normal: '正常',
  warning: '警告',
  error: '异常',
};

export const INSPECTION_STATUS_LABEL: Record<InspectionStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

export const PROBLEM_TYPE_LABEL: Record<ProblemType, string> = {
  lighting: '照明问题',
  floor: '地胶问题',
  net: '球网问题',
  equipment: '设备问题',
  other: '其他问题',
};

export interface Member {
  id: string;
  name: string;
  phone: string;
  level: MemberLevel;
  balance: number;
  giftHours: number;
  createdAt: string;
  status: MemberStatus;
  note?: string;
}

export interface MemberPackage {
  id: string;
  memberId: string;
  name: string;
  type: PackageType;
  totalCount: number;
  usedCount: number;
  totalHours: number;
  usedHours: number;
  applicableCourtTypes: CourtType[];
  applicableTimeSlots: string[];
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface PackageDeductionDetail {
  packageId: string;
  packageName: string;
  packageType: PackageType;
  deductedCount: number;
  deductedHours: number;
  deductedAmount: number;
}

export interface BookingSettleDetails {
  packageDeductions: PackageDeductionDetail[];
  balanceDeduction: number;
  totalAmount: number;
}

export interface MemberTransaction {
  id: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  hours: number;
  beforeBalance: number;
  afterBalance: number;
  beforeHours: number;
  afterHours: number;
  remark?: string;
  relatedBookingId?: string;
  relatedPackageId?: string;
  packageDeductions?: PackageDeductionDetail[];
  balanceDeduction?: number;
  createdAt: string;
}

export const MEMBER_LEVEL_LABEL: Record<MemberLevel, string> = {
  normal: '普通会员',
  silver: '白银会员',
  gold: '黄金会员',
  diamond: '钻石会员',
};

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  active: '正常',
  inactive: '停用',
  frozen: '冻结',
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  recharge: '储值',
  deduct: '扣费',
  refund: '退款',
  gift_hours: '赠送课时',
  gift_amount: '赠送金额',
  consume: '消费',
  package_purchase: '购买套餐',
  package_deduct: '套餐抵扣',
};

export const PACKAGE_TYPE_LABEL: Record<PackageType, string> = {
  count: '次卡',
  hourly: '小时卡',
  time_slot: '时段套餐',
};

export const PACKAGE_STATUS_LABEL: Record<PackageStatus, string> = {
  active: '有效',
  expired: '已过期',
  depleted: '已用完',
};
