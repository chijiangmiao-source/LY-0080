import { useState } from 'preact/hooks';
import type { Booking, Court } from '../types';
import { getTodayStr, isDateBeforeToday, isEndTimeBeforeStart } from '../lib/utils';
import { isTimeSlotConflict } from '../lib/storage';

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
