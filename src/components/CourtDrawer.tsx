import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'preact/hooks';
import type { Court, Booking, Inspection } from '../types';
import {
  BOOKING_STATUS_LABEL,
  COURT_TYPE_LABEL,
  EQUIPMENT_STATUS_LABEL,
  PROBLEM_TYPE_LABEL,
  INSPECTION_STATUS_LABEL,
  BOOKING_PROGRESS_STATUS_LABEL,
} from '../types';
import { formatDate, getBookingProgressStatus, getBookingProgressBadgeClass } from '../lib/utils';
import { X, Lightbulb, Layers, CalendarClock, ChevronDown, ChevronUp, History } from 'lucide-preact';

interface CourtDrawerProps {
  open: boolean;
  onClose: () => void;
  court: Court | null;
  bookings: Booking[];
  inspections: Inspection[];
  onEdit: () => void;
  onAddBooking: () => void;
  onAddInspection: () => void;
  onCancelBooking: (id: string) => void;
  onRescheduleBooking: (booking: Booking) => void;
}

export function CourtDrawer({
  open,
  onClose,
  court,
  bookings,
  inspections,
  onEdit,
  onAddBooking,
  onAddInspection,
  onCancelBooking,
  onRescheduleBooking,
}: CourtDrawerProps) {
  if (!court) return null;

  const [expandedBookingIds, setExpandedBookingIds] = useState<Set<string>>(new Set());

  const toggleBookingExpand = (bookingId: string) => {
    setExpandedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  };

  const hasEquipmentWarning =
    court.lightingStatus !== 'normal' || court.floorStatus !== 'normal';

  const getEquipmentBadgeClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getBookingBadgeClass = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-green-100 text-green-700';
      case 'booked':
        return 'bg-blue-100 text-blue-700';
      case 'in_use':
        return 'bg-purple-100 text-purple-700';
      case 'disabled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-xl overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {court.name}
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-0.5">{court.code}</p>
            </div>
            <Dialog.Close className="rounded-md p-2 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            {hasEquipmentWarning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 mb-2">
                  ⚠️ 设备异常提醒
                </p>
                <div className="flex flex-wrap gap-2">
                  {court.lightingStatus !== 'normal' && (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <Lightbulb className="w-4 h-4" />
                      照明：{EQUIPMENT_STATUS_LABEL[court.lightingStatus]}
                    </span>
                  )}
                  {court.floorStatus !== 'normal' && (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <Layers className="w-4 h-4" />
                      地胶：{EQUIPMENT_STATUS_LABEL[court.floorStatus]}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={onEdit}>
                编辑场地
              </button>
              <button
                className="btn-primary flex-1"
                onClick={onAddBooking}
                disabled={court.bookingStatus === 'disabled'}
                title={court.bookingStatus === 'disabled' ? '该场地已停用，无法预订' : ''}
              >
                {court.bookingStatus === 'disabled' ? '已停用' : '预订登记'}
              </button>
            </div>

            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">基本信息</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">场地类型</p>
                  <p className="text-gray-900 font-medium mt-0.5">
                    {COURT_TYPE_LABEL[court.type]}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">所在区域</p>
                  <p className="text-gray-900 font-medium mt-0.5">
                    {court.zone || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">预订状态</p>
                  <p className="mt-0.5">
                    <span className={`badge ${getBookingBadgeClass(court.bookingStatus)}`}>
                      {BOOKING_STATUS_LABEL[court.bookingStatus]}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">创建时间</p>
                  <p className="text-gray-900 font-medium mt-0.5">
                    {formatDate(court.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">照明状态</p>
                  <p className="mt-0.5">
                    <span className={`badge ${getEquipmentBadgeClass(court.lightingStatus)}`}>
                      {EQUIPMENT_STATUS_LABEL[court.lightingStatus]}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">地胶状态</p>
                  <p className="mt-0.5">
                    <span className={`badge ${getEquipmentBadgeClass(court.floorStatus)}`}>
                      {EQUIPMENT_STATUS_LABEL[court.floorStatus]}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">预订记录</h3>
                <button
                  className={`text-sm ${court.bookingStatus === 'disabled' ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}
                  onClick={court.bookingStatus === 'disabled' ? undefined : onAddBooking}
                  disabled={court.bookingStatus === 'disabled'}
                >
                  {court.bookingStatus === 'disabled' ? '已停用' : '+ 新增预订'}
                </button>
              </div>
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">暂无预订记录</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const progressStatus = getBookingProgressStatus(booking);
                    const isExpanded = expandedBookingIds.has(booking.id);
                    const hasChanges = booking.changeHistory && booking.changeHistory.length > 0;
                    return (
                      <div key={booking.id} className="border border-gray-100 rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {booking.customerName}
                              </p>
                              <span className={`badge ${getBookingProgressBadgeClass(progressStatus)}`}>
                                {BOOKING_PROGRESS_STATUS_LABEL[progressStatus]}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {booking.customerPhone}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className={`text-xs ${court.bookingStatus === 'disabled' ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}
                              onClick={court.bookingStatus === 'disabled' ? undefined : () => onRescheduleBooking(booking)}
                              disabled={court.bookingStatus === 'disabled'}
                              title={court.bookingStatus === 'disabled' ? '该场地已停用，不可改约' : ''}
                            >
                              <CalendarClock className="w-3.5 h-3.5 inline" />
                              改期
                            </button>
                            <button
                              className="text-xs text-red-600 hover:text-red-700"
                              onClick={() => onCancelBooking(booking.id)}
                            >
                              取消预订
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          <p>
                            {booking.date} {booking.startTime} - {booking.endTime}
                          </p>
                          {booking.notes && (
                            <p className="text-gray-500 mt-1">备注：{booking.notes}</p>
                          )}
                          {hasChanges && (
                            <div className="mt-1">
                              <button
                                onClick={() => toggleBookingExpand(booking.id)}
                                className="text-emerald-600 inline-flex items-center gap-1 text-xs hover:text-emerald-700"
                              >
                                <History className="w-3.5 h-3.5" />
                                已改期 {booking.changeHistory!.length} 次
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        {isExpanded && hasChanges && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {[...booking.changeHistory!].reverse().map((change) => (
                              <div key={change.id} className="bg-gray-50 rounded p-2 text-xs text-gray-600 border border-gray-200">
                                <p className="text-gray-500 text-[11px] mb-1">
                                  {new Date(change.changedAt).toLocaleString('zh-CN')}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">
                                    {change.previousDate} {change.previousStartTime}-{change.previousEndTime}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-emerald-600 font-medium">
                                    {change.newDate} {change.newStartTime}-{change.newEndTime}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">巡检记录</h3>
                <button className="text-sm text-emerald-600 hover:text-emerald-700" onClick={onAddInspection}>
                  + 新增巡检
                </button>
              </div>
              {inspections.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">暂无巡检记录</p>
              ) : (
                <div className="space-y-3">
                  {inspections.map((inspection) => (
                    <div key={inspection.id} className="border border-gray-100 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {PROBLEM_TYPE_LABEL[inspection.problemType]}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(inspection.date)} · {inspection.inspector}
                          </p>
                        </div>
                        <span
                          className={`badge ${
                            inspection.status === 'resolved'
                              ? 'bg-green-100 text-green-700'
                              : inspection.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {INSPECTION_STATUS_LABEL[inspection.status]}
                        </span>
                      </div>
                      {inspection.notes && (
                        <p className="text-xs text-gray-600 mt-2">备注：{inspection.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
