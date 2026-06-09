import { useMemo } from 'preact/hooks';
import type { Court, Booking, Inspection, Member, MemberTransaction } from '../types';
import { COURT_TYPE_LABEL } from '../types';
import { Bar } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { GridRows } from '@visx/grid';
import {
  Building2,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  Play,
  CalendarDays,
  Wallet,
  CreditCard,
  AlertCircle,
  Users,
} from 'lucide-preact';
import { getTodayStr, getBookingProgressStatus } from '../lib/utils';
import { getTodayRechargeAmount, getTodayConsumeAmount, getLowBalanceMemberCount } from '../lib/storage';

interface StatsOverviewProps {
  courts: Court[];
  bookings: Booking[];
  inspections: Inspection[];
  members: Member[];
  transactions: MemberTransaction[];
}

interface BookingStatusDatum {
  label: string;
  value: number;
  color: string;
}

interface CourtTypeDatum {
  type: string;
  label: string;
  count: number;
}

export function StatsOverview({ courts, bookings, inspections, members, transactions }: StatsOverviewProps) {
  const stats = useMemo(() => {
    const idleCourts = courts.filter((c) => c.bookingStatus === 'idle').length;
    const bookedCourts = courts.filter((c) => c.bookingStatus === 'booked').length;
    const inUseCourts = courts.filter((c) => c.bookingStatus === 'in_use').length;
    const disabledCourts = courts.filter((c) => c.bookingStatus === 'disabled').length;
    const abnormalEquipment = courts.filter(
      (c) => c.lightingStatus !== 'normal' || c.floorStatus !== 'normal'
    ).length;
    const pendingInspections = inspections.filter((i) => i.status !== 'resolved').length;

    const today = getTodayStr();
    const todayBookings = bookings.filter((b) => b.date === today).length;
    const inProgressCourtSet = new Set(
      bookings
        .filter((b) => getBookingProgressStatus(b) === 'in_progress')
        .map((b) => b.courtId)
    );
    const inProgressCourts = inProgressCourtSet.size;

    const todayRecharge = getTodayRechargeAmount();
    const todayConsume = getTodayConsumeAmount();
    const lowBalanceCount = getLowBalanceMemberCount();
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const totalMemberBalance = members.reduce((sum, m) => sum + m.balance, 0);

    return {
      total: courts.length,
      idle: idleCourts,
      booked: bookedCourts,
      inUse: inUseCourts,
      disabled: disabledCourts,
      abnormal: abnormalEquipment,
      bookingCount: bookings.length,
      pendingInspections,
      totalInspections: inspections.length,
      todayBookings,
      inProgressCourts,
      todayRecharge,
      todayConsume,
      lowBalanceCount,
      activeMembers,
      totalMemberBalance,
      totalMembers: members.length,
    };
  }, [courts, bookings, inspections, members, transactions]);

  const bookingStatusData = useMemo<BookingStatusDatum[]>(
    () => [
      { label: '空闲', value: stats.idle, color: '#10b981' },
      { label: '已预订', value: stats.booked, color: '#3b82f6' },
      { label: '使用中', value: stats.inUse, color: '#a855f7' },
      { label: '停用', value: stats.disabled, color: '#6b7280' },
    ],
    [stats]
  );

  const width = 500;
  const height = 220;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: bookingStatusData.map((d) => d.label),
        range: [0, xMax],
        padding: 0.4,
      }),
    [bookingStatusData, xMax]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, Math.max(stats.total, 1)],
        range: [yMax, 0],
        nice: true,
      }),
    [stats.total, yMax]
  );

  const courtTypeData = useMemo<CourtTypeDatum[]>(() => {
    const typeCount: Record<string, number> = {};
    courts.forEach((c) => {
      typeCount[c.type] = (typeCount[c.type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      label: COURT_TYPE_LABEL[type as keyof typeof COURT_TYPE_LABEL] || type,
      count,
    }));
  }, [courts]);

  const typeWidth = 400;
  const typeHeight = 200;
  const typeMargin = { top: 20, right: 20, bottom: 40, left: 50 };
  const typeXMax = typeWidth - typeMargin.left - typeMargin.right;
  const typeYMax = typeHeight - typeMargin.top - typeMargin.bottom;

  const typeXScale = useMemo(
    () =>
      scaleBand<string>({
        domain: courtTypeData.map((d) => d.label),
        range: [0, typeXMax],
        padding: 0.4,
      }),
    [courtTypeData, typeXMax]
  );

  const typeYScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, Math.max(...courtTypeData.map((d) => d.count), 1)],
        range: [typeYMax, 0],
        nice: true,
      }),
    [courtTypeData, typeYMax]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总场地数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <span className="text-emerald-600 font-medium">{stats.idle}</span> 空闲 · 
            <span className="text-blue-600 font-medium ml-1">{stats.booked}</span> 预订 · 
            <span className="text-purple-600 font-medium ml-1">{stats.inUse}</span> 使用中
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">预订总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.bookingCount}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">累计预订记录数</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日预订数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">当天预订总场次</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">进行中场地数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressCourts}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">当前正在使用的场地</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">设备异常</p>
              <p className="text-2xl font-bold text-gray-900">{stats.abnormal}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">场地照明或地胶异常</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待处理巡检</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingInspections}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">共 {stats.totalInspections} 条巡检记录</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">会员总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">活跃会员 {stats.activeMembers} 人</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日储值金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{stats.todayRecharge.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">会员储值总额：¥{stats.totalMemberBalance.toFixed(2)}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日消费金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{stats.todayConsume.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">会员今日消费扣费合计</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">余额不足会员数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowBalanceCount}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">余额 ≤ 0 的活跃会员</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">场地状态分布</h3>
          <svg width={width} height={height} className="w-full h-auto max-w-full">
            <Group left={margin.left} top={margin.top}>
              <GridRows
                scale={yScale}
                width={xMax}
                height={yMax}
                stroke="#e5e7eb"
                strokeDasharray="3,3"
              />
              <AxisLeft
                scale={yScale}
                stroke="#9ca3af"
                tickStroke="#9ca3af"
                tickLabelProps={() => ({
                  fill: '#6b7280',
                  fontSize: 12,
                  textAnchor: 'end',
                  dy: '0.33em',
                })}
              />
              <AxisBottom
                scale={xScale}
                top={yMax}
                stroke="#9ca3af"
                tickStroke="#9ca3af"
                tickLabelProps={() => ({
                  fill: '#6b7280',
                  fontSize: 12,
                  textAnchor: 'middle',
                })}
              />
              {bookingStatusData.map((d) => {
                const barWidth = xScale.bandwidth();
                const barX = xScale(d.label);
                const barY = yScale(d.value);
                const barHeight = yMax - barY;
                if (barX == null) return null;
                return (
                  <Bar
                    key={d.label}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={d.color}
                    rx={4}
                  />
                );
              })}
            </Group>
          </svg>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">场地类型分布</h3>
          <svg width={typeWidth} height={typeHeight} className="w-full h-auto max-w-full">
            <Group left={typeMargin.left} top={typeMargin.top}>
              <GridRows
                scale={typeYScale}
                width={typeXMax}
                height={typeYMax}
                stroke="#e5e7eb"
                strokeDasharray="3,3"
              />
              <AxisLeft
                scale={typeYScale}
                stroke="#9ca3af"
                tickStroke="#9ca3af"
                tickLabelProps={() => ({
                  fill: '#6b7280',
                  fontSize: 12,
                  textAnchor: 'end',
                  dy: '0.33em',
                })}
              />
              <AxisBottom
                scale={typeXScale}
                top={typeYMax}
                stroke="#9ca3af"
                tickStroke="#9ca3af"
                tickLabelProps={() => ({
                  fill: '#6b7280',
                  fontSize: 12,
                  textAnchor: 'middle',
                })}
              />
              {courtTypeData.map((d) => {
                const barWidth = typeXScale.bandwidth();
                const barX = typeXScale(d.label);
                const barY = typeYScale(d.count);
                const barHeight = typeYMax - barY;
                if (barX == null) return null;
                return (
                  <Bar
                    key={d.label}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill="#10b981"
                    rx={4}
                  />
                );
              })}
            </Group>
          </svg>
        </div>
      </div>
    </div>
  );
}
