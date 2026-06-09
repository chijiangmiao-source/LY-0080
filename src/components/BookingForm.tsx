import { useState, useMemo } from 'preact/hooks';
import type { Booking, Court, Member } from '../types';
import { MEMBER_LEVEL_LABEL, PACKAGE_TYPE_LABEL } from '../types';
import { getTodayStr, isDateBeforeToday, isEndTimeBeforeStart, calculateBookingAmount } from '../lib/utils';
import {
  isTimeSlotConflict,
  getMemberByPhone,
  getMembers,
  previewBookingDeduction,
  isPackageApplicable,
  getPackagesByMember,
} from '../lib/storage';
import { Search, User, Wallet, AlertTriangle, CheckCircle, Ticket, Sparkles } from 'lucide-preact';

interface BookingFormProps {
  courts: Court[];
  selectedCourtId?: string;
  onSubmit: (data: Omit<Booking, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function BookingForm({ courts, selectedCourtId, onSubmit, onCancel }: BookingFormProps) {
  const availableCourts = useMemo(
    () => courts.filter((c) => c.bookingStatus !== 'disabled'),
    [courts]
  );

  const getInitialCourtId = () => {
    if (selectedCourtId) {
      const selected = courts.find((c) => c.id === selectedCourtId);
      if (selected && selected.bookingStatus !== 'disabled') {
        return selectedCourtId;
      }
    }
    return availableCourts[0]?.id || '';
  };

  const [formData, setFormData] = useState({
    courtId: getInitialCourtId(),
    customerName: '',
    customerPhone: '',
    memberId: '',
    date: getTodayStr(),
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneSearchText, setPhoneSearchText] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const selectedMember = useMemo(() => {
    if (!formData.memberId) return null;
    const members = getMembers();
    return members.find((m) => m.id === formData.memberId) || null;
  }, [formData.memberId]);

  const selectedCourt = useMemo(() => {
    return courts.find((c) => c.id === formData.courtId) || null;
  }, [formData.courtId, courts]);

  const deductionPreview = useMemo(() => {
    if (!selectedMember || !selectedCourt || !formData.date || !formData.startTime || !formData.endTime) {
      return null;
    }
    return previewBookingDeduction(
      selectedMember.id,
      selectedCourt.type,
      formData.date,
      formData.startTime,
      formData.endTime
    );
  }, [selectedMember, selectedCourt, formData.date, formData.startTime, formData.endTime]);

  const applicablePackages = useMemo(() => {
    if (!selectedMember || !selectedCourt || !formData.date || !formData.startTime || !formData.endTime) {
      return [];
    }
    return getPackagesByMember(selectedMember.id).filter((p) =>
      isPackageApplicable(p, selectedCourt.type, formData.date, formData.startTime, formData.endTime)
    );
  }, [selectedMember, selectedCourt, formData.date, formData.startTime, formData.endTime]);

  const estimatedAmount = useMemo(() => {
    if (!selectedCourt || !formData.startTime || !formData.endTime) return 0;
    return calculateBookingAmount(formData.startTime, formData.endTime, selectedCourt.type);
  }, [selectedCourt, formData.startTime, formData.endTime]);

  const handlePhoneSearch = (text: string) => {
    setPhoneSearchText(text);
    if (text.length >= 2) {
      const members = getMembers();
      const results = members.filter(
        (m) => m.phone.includes(text) || m.name.includes(text)
      );
      setMemberSearchResults(results.slice(0, 10));
      setShowMemberDropdown(results.length > 0);
    } else {
      setMemberSearchResults([]);
      setShowMemberDropdown(false);
    }
  };

  const selectMember = (member: Member) => {
    setFormData((prev) => ({
      ...prev,
      memberId: member.id,
      customerName: member.name,
      customerPhone: member.phone,
    }));
    setPhoneSearchText(member.phone);
    setShowMemberDropdown(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.customerName;
      delete next.customerPhone;
      return next;
    });
  };

  const clearMemberSelection = () => {
    setFormData((prev) => ({
      ...prev,
      memberId: '',
    }));
  };

  const handlePhoneBlur = () => {
    setTimeout(() => setShowMemberDropdown(false), 200);
    if (!formData.memberId && formData.customerPhone) {
      const found = getMemberByPhone(formData.customerPhone);
      if (found) {
        selectMember(found);
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.courtId) {
      newErrors.courtId = '请选择场地';
    } else {
      const selectedCourt = courts.find((c) => c.id === formData.courtId);
      if (selectedCourt?.bookingStatus === 'disabled') {
        newErrors.courtId = '该场地已停用，无法预订';
      }
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = '客户姓名不能为空';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = '联系电话不能为空';
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
      formData.courtId &&
      formData.date &&
      formData.startTime &&
      formData.endTime &&
      isTimeSlotConflict(formData.courtId, formData.date, formData.startTime, formData.endTime)
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
        courtId: formData.courtId,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        memberId: formData.memberId || undefined,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes.trim() || undefined,
      });
    }
  };

  const update = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === 'customerPhone' && value !== phoneSearchText) {
      if (formData.memberId) {
        clearMemberSelection();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">选择场地 *</label>
        <select
          className="input"
          value={formData.courtId}
          onChange={(e) => update('courtId', (e.target as HTMLSelectElement).value)}
        >
          <option value="">请选择场地</option>
          {availableCourts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.code} - {court.name}
            </option>
          ))}
        </select>
        {availableCourts.length === 0 && (
          <p className="text-yellow-600 text-xs mt-1">暂无可预订的场地</p>
        )}
        {errors.courtId && <p className="text-red-500 text-xs mt-1">{errors.courtId}</p>}
      </div>

      <div className="space-y-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">会员关联</span>
        </div>

        <div className="relative">
          <label className="label">手机号搜索会员</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              className="input pl-9"
              value={phoneSearchText}
              onInput={(e) => {
                const text = (e.target as HTMLInputElement).value;
                handlePhoneSearch(text);
                update('customerPhone', text);
              }}
              onFocus={() => phoneSearchText && handlePhoneSearch(phoneSearchText)}
              onBlur={handlePhoneBlur}
              placeholder="输入手机号或姓名搜索会员"
            />
          </div>
          {showMemberDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {memberSearchResults.map((member) => (
                <div
                  key={member.id}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onMouseDown={() => selectMember(member)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{MEMBER_LEVEL_LABEL[member.level]}</p>
                      <p className="text-xs font-medium text-emerald-600">
                        ¥{member.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMember && (
          <div className="flex items-start justify-between p-3 bg-white rounded-md border border-emerald-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedMember.name}
                  <span className="text-xs text-gray-500 ml-2">
                    {MEMBER_LEVEL_LABEL[selectedMember.level]}
                  </span>
                </p>
                <p className="text-xs text-gray-500">{selectedMember.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm font-semibold text-emerald-600">
                    ¥{selectedMember.balance.toFixed(2)}
                  </p>
                </div>
                {selectedMember.giftHours > 0 && (
                  <p className="text-xs text-blue-600">赠送课时 {selectedMember.giftHours}h</p>
                )}
              </div>
              <button
                type="button"
                onClick={clearMemberSelection}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                清除
              </button>
            </div>
          </div>
        )}

        {selectedMember && selectedMember.balance === 0 && deductionPreview && deductionPreview.balanceDeduction > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">余额不足提醒</p>
              <p className="text-xs text-amber-700">
                套餐抵扣后还需 ¥{deductionPreview.balanceDeduction.toFixed(2)}，当前余额为¥{selectedMember.balance.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {selectedMember && deductionPreview && (
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">套餐自动抵扣预估</span>
              <span className="text-xs text-gray-500 ml-auto">总计 ¥{estimatedAmount.toFixed(2)}</span>
            </div>
            {applicablePackages.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">可用套餐：</p>
                <div className="flex flex-wrap gap-1">
                  {applicablePackages.slice(0, 3).map((pkg) => (
                    <span key={pkg.id} className="badge bg-white text-purple-700 border border-purple-200 text-xs">
                      <Ticket className="w-3 h-3 inline mr-0.5" />
                      {pkg.name}
                      <span className="text-gray-400 ml-1">
                        ({PACKAGE_TYPE_LABEL[pkg.type]})
                      </span>
                    </span>
                  ))}
                  {applicablePackages.length > 3 && (
                    <span className="text-xs text-gray-400 self-center">
                      +{applicablePackages.length - 3} 个
                    </span>
                  )}
                </div>
              </div>
            )}
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
                <p className="text-gray-500">当前时段无可用套餐</p>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">客户姓名 *</label>
          <input
            type="text"
            className="input"
            value={formData.customerName}
            onInput={(e) => update('customerName', (e.target as HTMLInputElement).value)}
            placeholder="请输入客户姓名"
          />
          {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
        </div>
        <div>
          <label className="label">联系电话 *</label>
          <input
            type="tel"
            className="input"
            value={formData.customerPhone}
            onInput={(e) => update('customerPhone', (e.target as HTMLInputElement).value)}
            placeholder="请输入联系电话"
          />
          {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
        </div>
      </div>

      <div>
        <label className="label">预订日期 *</label>
        <input
          type="date"
          className="input"
          value={formData.date}
          min={getTodayStr()}
          onInput={(e) => update('date', (e.target as HTMLInputElement).value)}
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
          />
          {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
        </div>
      </div>

      <div>
        <label className="label">备注</label>
        <textarea
          className="input min-h-[80px]"
          value={formData.notes}
          onInput={(e) => update('notes', (e.target as HTMLTextAreaElement).value)}
          placeholder="可选"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary">
          确认预订
        </button>
      </div>
    </form>
  );
}
