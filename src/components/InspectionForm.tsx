import { useState } from 'preact/hooks';
import type { Inspection, Court, ProblemType, InspectionStatus } from '../types';
import { PROBLEM_TYPE_LABEL, INSPECTION_STATUS_LABEL } from '../types';
import { getTodayStr } from '../lib/utils';

interface InspectionFormProps {
  courts: Court[];
  selectedCourtId?: string;
  onSubmit: (data: Omit<Inspection, 'id'>) => void;
  onCancel: () => void;
}

export function InspectionForm({ courts, selectedCourtId, onSubmit, onCancel }: InspectionFormProps) {
  const [formData, setFormData] = useState({
    courtId: selectedCourtId || courts[0]?.id || '',
    date: getTodayStr(),
    inspector: '',
    problemType: 'lighting' as ProblemType,
    status: 'pending' as InspectionStatus,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.courtId) {
      newErrors.courtId = '请选择场地';
    }
    if (!formData.date) {
      newErrors.date = '请选择巡检日期';
    }
    if (!formData.inspector.trim()) {
      newErrors.inspector = '巡检人不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        courtId: formData.courtId,
        date: formData.date,
        inspector: formData.inspector.trim(),
        problemType: formData.problemType,
        status: formData.status,
        notes: formData.notes.trim(),
      });
    }
  };

  const update = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
          {courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.code} - {court.name}
            </option>
          ))}
        </select>
        {errors.courtId && <p className="text-red-500 text-xs mt-1">{errors.courtId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">巡检日期 *</label>
          <input
            type="date"
            className="input"
            value={formData.date}
            onInput={(e) => update('date', (e.target as HTMLInputElement).value)}
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="label">巡检人 *</label>
          <input
            type="text"
            className="input"
            value={formData.inspector}
            onInput={(e) => update('inspector', (e.target as HTMLInputElement).value)}
            placeholder="请输入巡检人姓名"
          />
          {errors.inspector && <p className="text-red-500 text-xs mt-1">{errors.inspector}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">问题类型</label>
          <select
            className="input"
            value={formData.problemType}
            onChange={(e) => update('problemType', (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(PROBLEM_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">处理状态</label>
          <select
            className="input"
            value={formData.status}
            onChange={(e) => update('status', (e.target as HTMLSelectElement).value)}
          >
            {Object.entries(INSPECTION_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">备注</label>
        <textarea
          className="input min-h-[80px]"
          value={formData.notes}
          onInput={(e) => update('notes', (e.target as HTMLTextAreaElement).value)}
          placeholder="可选，记录详细情况"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary">
          保存记录
        </button>
      </div>
    </form>
  );
}
