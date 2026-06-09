import { useState, useMemo } from 'preact/hooks';
import type { Booking, Court, Member } from '../types';
import { getTodayStr, isDateBeforeToday, isEndTimeBeforeStart, calculateBookingAmount } from '../lib/utils';
import { isTimeSlotConflict, previewBookingDeduction, getMemberById } from '../lib/storage';
import { Sparkles, Ticket, Wallet } from 'lucide-preact';

interface RescheduleFormProps {
  booking: Booking;
  courts: Court[];
  onSubmit: (data: { date: string; startTime: string; endTime: string }) => void;
  onCancel: () => void;
}

export function RescheduleForm({ booking, courts, onSubmit, onCancel }: RescheduleFormProps) {
  const court = courts.find((c) => c.id === booking.courtId);
  const isCourtDisabled = court?.bookingStatus === 'disabled';

  const [formData, setFormData] = useState({
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bookingMember: Member | undefined = useMemo(() => {
    if (!booking.memberId) return undefined;
    return getMemberById(booking.memberId);
  }, [booking.memberId]);

  const deductionPreview = useMemo(() => {
    if (!bookingMember || !court || !formData.date || !formData.startTime || !formData.endTime) {
      return null;
    }
    return previewBookingDeduction(
      bookingMember.id,
      court.type,
      formData.date,
      formData.startTime,
      formData.endTime
    );
  }, [bookingMember, court, formData.date, formData.startTime, formData.endTime]);

  const estimatedAmount = useMemo(() => {
    if (!court || !formData.startTime || !formData.endTime) return 0;
    return calculateBookingAmount(formData.startTime, formData.endTime, court.type);
  }, [court, formData.startTime, formData.endTime]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isCourtDisabled) {
      newErrors.court = '该场地已停用，不可改约';
    }

    if (!formData.date) {
      newErrors.date = '请选择预订日期';
    } else if (isDateBeforeToday(formData.date)) {
      newErrors.date = '预订日期不能早于当前日期';
    }
    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时间';
    }
    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间';
    } else if (formData.startTime && isEndTimeBeforeStart(formData.startTime, formData.endTime)) {
      newErrors.endTime = '结束时间不能早于开始时间';
    } else if (
      formData.date &&
      formData.startTime &&
      formData.endTime &&
      isTimeSlotConflict(booking.courtId, formData.date, formData.startTime, formData.endTime, booking.id)
    ) {
      newErrors.endTime = '该时段已被预订，请选择其他时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
    }
  };

  const update = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges =
    formData.date !== booking.date ||
    formData.startTime !== booking.startTime ||
    formData.endTime !== booking.endTime;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card p-4 bg-gray-50 border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">原预订信息</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <span className="text-gray-500">场地：</span>
            {court ? `${court.code} - ${court.name}` : '未知场地'}
          </p>
          <p>
            <span className="text-gray-500">客户：</span>
            {booking.customerName} ({booking.customerPhone})
          </p>
          <p>
            <span className="text-gray-500">日期：</span>
            {booking.date}
          </p>
          <p>
            <span className="text-gray-500">时间：</span>
            {booking.startTime} - {booking.endTime}
          </p>
          {booking.changeHistory && booking.changeHistory.length > 0 && (
            <p>
              <span className="text-gray-500">已改期：</span>
              {booking.changeHistory.length} 次
            </p>
          )}
        </div>
      </div>

      {errors.court && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{errors.court}</p>
        </div>
      )}

      <div>
        <label className="label">预订日期 *</label>
        <input
          type="date"
          className="input"
          value={formData.date}
          min={getTodayStr()}
          onInput={(e) => update('date', (e.target as HTMLInputElement).value)}
          disabled={isCourtDisabled}
        />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">开始时间 *</label>
          <input
            type="time"
            className="input"
            value={formData.startTime}
            onInput={(e) => update('startTime', (e.target as HTMLInputElement).value)}
            disabled={isCourtDisabled}
          />
          {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
        </div>
        <div>
          <label className="label">结束时间 *</label>
          <input
            type="time"
            className="input"
            value={formData.endTime}
            onInput={(e) => update('endTime', (e.target as HTMLInputElement).value)}
            disabled={isCourtDisabled}
          />
          {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
        </div>
      </div>

      {bookingMember && deductionPreview && court && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">改期后套餐抵扣预估</span>
            <span className="text-xs text-gray-500 ml-auto">总计 ¥{estimatedAmount.toFixed(2)}</span>
          </div>
          <div className="space-y-1 text-xs">
            {deductionPreview.packageDeductions.length > 0 ? (
              deductionPreview.packageDeductions.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-600">
                    <Ticket className="w-3 h-3 inline mr-1 text-purple-500" />
                    {d.packageName}
                    {d.deductedCount > 0 && <span className="ml-1">-{d.deductedCount}次</span>}
                    {d.deductedHours > 0 && <span className="ml-1">-{d.deductedHours}h</span>}
                  </span>
                  <span className="font-medium text-emerald-600">
                    -¥{d.deductedAmount.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">改期后当前时段无可用套餐</p>
            )}
            {deductionPreview.balanceDeduction > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-purple-100">
                <span className="text-gray-600">
                  <Wallet className="w-3 h-3 inline mr-1 text-orange-500" />
                  储值余额补扣
                </span>
                <span className="font-medium text-orange-600">
                  -¥{deductionPreview.balanceDeduction.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 font-medium">
              <span className="text-gray-700">结算时应付</span>
              <span className="text-purple-700">
                ¥{deductionPreview.balanceDeduction.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {booking.changeHistory && booking.changeHistory.length > 0 && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">变更历史</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {[...booking.changeHistory].reverse().map((change) => (
              <div key={change.id} className="text-xs text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                <p className="text-gray-500">
                  {new Date(change.changedAt).toLocaleString('zh-CN')}
                </p>
                <p>
                  由 {change.previousDate} {change.previousStartTime}-{change.previousEndTime}
                </p>
                <p>
                  改为 {change.newDate} {change.newStartTime}-{change.newEndTime}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isCourtDisabled || !hasChanges}
          title={!hasChanges && !isCourtDisabled ? '请先修改日期或时间' : ''}
        >
          确认改期
        </button>
      </div>
    </form>
  );
}
