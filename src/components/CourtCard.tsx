import type { Court } from '../types';
import {
  BOOKING_STATUS_LABEL,
  COURT_TYPE_LABEL,
  EQUIPMENT_STATUS_LABEL,
} from '../types';
import { Lightbulb, Layers, Edit2, Trash2, Eye } from 'lucide-preact';

interface CourtCardProps {
  court: Court;
  onView: (court: Court) => void;
  onEdit: (court: Court) => void;
  onDelete: (court: Court) => void;
}

export function CourtCard({ court, onView, onEdit, onDelete }: CourtCardProps) {
  const hasEquipmentWarning =
    court.lightingStatus !== 'normal' || court.floorStatus !== 'normal';

  const getBookingBadgeClass = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'booked':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_use':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'disabled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div
      className={`card p-4 transition-all hover:shadow-md cursor-pointer ${
        hasEquipmentWarning ? 'ring-2 ring-red-300 border-red-200' : ''
      }`}
      onClick={() => onView(court)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{court.name}</h3>
            {hasEquipmentWarning && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                设备异常
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{court.code}</p>
        </div>
        <span className={`badge border ${getBookingBadgeClass(court.bookingStatus)}`}>
          {BOOKING_STATUS_LABEL[court.bookingStatus]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">类型</span>
          <span className="text-gray-900 font-medium">{COURT_TYPE_LABEL[court.type]}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">区域</span>
          <span className="text-gray-900 font-medium">{court.zone || '-'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <Lightbulb className="w-3.5 h-3.5" />
            照明
          </span>
          <span
            className={`font-medium ${
              court.lightingStatus === 'normal'
                ? 'text-green-600'
                : court.lightingStatus === 'warning'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {EQUIPMENT_STATUS_LABEL[court.lightingStatus]}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <Layers className="w-3.5 h-3.5" />
            地胶
          </span>
          <span
            className={`font-medium ${
              court.floorStatus === 'normal'
                ? 'text-green-600'
                : court.floorStatus === 'warning'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {EQUIPMENT_STATUS_LABEL[court.floorStatus]}
          </span>
        </div>
      </div>

      <div
        className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          title="查看详情"
          onClick={() => onView(court)}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded-md hover:bg-blue-50 text-blue-600 hover:text-blue-700"
          title="编辑"
          onClick={() => onEdit(court)}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700"
          title="删除"
          onClick={() => onDelete(court)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
