export type BookingStatus = 'idle' | 'booked' | 'in_use' | 'disabled';
export type EquipmentStatus = 'normal' | 'warning' | 'error';
export type CourtType = 'standard' | 'vip' | 'training' | 'competition';
export type InspectionStatus = 'pending' | 'processing' | 'resolved';
export type ProblemType = 'lighting' | 'floor' | 'net' | 'equipment' | 'other';
export type BookingProgressStatus = 'upcoming' | 'in_progress' | 'ended';

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
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt: string;
  changeHistory?: BookingChange[];
}

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
