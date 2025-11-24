'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './admin.module.css';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { defaultFormConfig } from '@/lib/formDefaults';
import { formatSchedule } from '@/lib/scheduleUtils';

type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

type Order = {
  id: string;
  name: string;
  phone: string;
  schedule: string;
  agreed: boolean;
  status: OrderStatus;
  created_at: string;
  people_count: number;
  total_amount: number;
  product_type: string;
};

type ScheduleConfig = {
  time: string;
  capacity: number;
};

type FormConfig = {
  schedules: ScheduleConfig[];
  details: string;
  bankName: string;
  accountNumber: string;
  depositor: string;
  price: string;
  price2: string;
  backgroundImage: string;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '대기',
  confirmed: '확정',
  cancelled: '취소',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<string | null>(null);

  const [config, setConfig] = useState<FormConfig>({
    schedules: [],
    details: defaultFormConfig.details,
    bankName: defaultFormConfig.bankName,
    accountNumber: defaultFormConfig.accountNumber,
    depositor: defaultFormConfig.depositor,
    price: defaultFormConfig.price,
    price2: defaultFormConfig.price2 || '150000',
    backgroundImage: defaultFormConfig.backgroundImage || '',
  });
  const [configSaving, setConfigSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      // Normalize schedules to object array
      let normalizedSchedules: ScheduleConfig[] = [];
      if (Array.isArray(data.schedules)) {
        normalizedSchedules = data.schedules.map((s: any) => {
          if (typeof s === 'string') return { time: s, capacity: 100 };
          return { time: s.time, capacity: s.capacity || 100 };
        });
      } else {
        normalizedSchedules = defaultFormConfig.schedules.map(s => ({ time: s, capacity: 100 }));
      }

      setConfig({
        schedules: normalizedSchedules,
        details: data.details || defaultFormConfig.details,
        bankName: data.bankName || defaultFormConfig.bankName,
        accountNumber: data.accountNumber || defaultFormConfig.accountNumber,
        depositor: data.depositor || defaultFormConfig.depositor,
        price: data.price || defaultFormConfig.price,
        price2: data.price2 || defaultFormConfig.price2 || '150000',
        backgroundImage: data.backgroundImage || '',
      });
    } catch (error) {
      console.error('Failed to load config', error);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setOrdersLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });

      if (res.status === 401) {
        setAuthed(false);
        return;
      }

      if (!res.ok) {
        throw new Error('목록을 불러올 수 없습니다.');
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setAuthed(true);
      await loadConfig();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '목록을 불러올 수 없습니다.';
      setFetchError(message);
      setAuthed(false);
    } finally {
      setOrdersLoading(false);
    }
  }, [loadConfig]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await bootstrap();
    setIsRefreshing(false);
  };

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount to prevent infinite loop

  const handleLogin = async () => {
    setFetchError('');
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || '비밀번호가 올바르지 않습니다.');
      }

      setPassword('');
      await bootstrap();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      setFetchError(message);
      setAuthed(false);
      setOrdersLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setOrders([]);
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setStatusUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || '상태 변경에 실패했습니다.');
      }

      const { order } = await res.json();
      setOrders((prev) => prev.map((item) => (item.id === id ? { ...item, status: order.status } : item)));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '상태 변경에 실패했습니다.';
      setFetchError(message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setStatusUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || '삭제에 실패했습니다.');
      }
      setOrders((prev) => prev.filter((item) => item.id !== id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '삭제에 실패했습니다.';
      setFetchError(message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim();
    return orders.filter((order) => {
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesSchedule = scheduleFilter ? order.schedule === scheduleFilter : true;
      const matchesSearch = term
        ? order.name.includes(term) || order.phone.includes(term)
        : true;
      return matchesStatus && matchesSchedule && matchesSearch;
    });
  }, [orders, statusFilter, scheduleFilter, searchTerm]);

  const summary = useMemo(() => {
    const statusCounts: Record<string, number> = { pending: 0, confirmed: 0, cancelled: 0 };
    const scheduleCounts: Record<string, { count: number; people: number }> = {};
    let totalPeople = 0;

    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      totalPeople += (order.people_count || 1);
      const key = order.schedule || '미지정';
      if (!scheduleCounts[key]) scheduleCounts[key] = { count: 0, people: 0 };

      // Only count confirmed orders for capacity calculation (consistent with API)
      if (order.status === 'confirmed') {
        scheduleCounts[key].count += 1;
        scheduleCounts[key].people += (order.people_count || 1);
      }
    });

    return {
      total: totalPeople,
      totalOrders: orders.length,
      statusCounts,
      scheduleCounts,
    };
  }, [orders]);

  const handleSchedulePartChange = (
    index: number,
    part: 'month' | 'day' | 'hour' | 'capacity',
    value: string
  ) => {
    setConfig((prev) => {
      const updated = [...prev.schedules];
      const current = updated[index] || { time: '', capacity: 100 };

      if (part === 'capacity') {
        updated[index] = { ...current, capacity: Number(value) || 0 };
        return { ...prev, schedules: updated };
      }

      const match = current.time.match(/(\d{1,2})월\s*(\d{1,2})일.*?(\d{1,2}):(\d{2})/);
      const pad = (n: number) => n.toString().padStart(2, '0');
      let month = match ? Number(match[1]) : 1;
      let day = match ? Number(match[2]) : 1;
      let hour = match ? Number(match[3]) : 0;

      if (part === 'month') month = Number(value);
      if (part === 'day') day = Number(value);
      if (part === 'hour') hour = Number(value);

      const year = new Date().getFullYear();
      const date = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:00`);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayText = Number.isNaN(date.getTime()) ? '' : ` (${dayNames[date.getDay()]})`;

      updated[index] = {
        ...current,
        time: `${pad(month)}월 ${pad(day)}일${dayText} ${pad(hour)}:00`
      };
      return { ...prev, schedules: updated };
    });
  };

  const addScheduleRow = () => {
    setConfig((prev) => {
      return {
        ...prev,
        schedules: [...prev.schedules, { time: '12월 25일 (수) 14:00', capacity: 6 }]
      };
    });
  };

  const removeScheduleRow = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const handleConfigSave = async () => {
    setConfigSaving(true);
    setFetchError('');
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || '설정 저장에 실패했습니다.');
      }
      await loadConfig();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '설정 저장에 실패했습니다.';
      setFetchError(message);
    } finally {
      setConfigSaving(false);
    }
  };

  if (authed !== true) {
    return (
      <main className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>관리자 로그인</h1>
          <p className={styles.subtitle}>비밀번호를 입력해 관리자 페이지에 접근하세요.</p>
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="관리자 비밀번호"
          />
          <Button onClick={handleLogin} disabled={ordersLoading}>
            {ordersLoading ? '확인 중...' : '로그인'}
          </Button>
          {fetchError && <p className={styles.error}>{fetchError}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1 className={styles.title}>관리자 페이지</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.headerIcon}
            onClick={handleRefresh}
            disabled={ordersLoading || isRefreshing}
            title="새로고침"
            aria-label="새로고침"
          >
            ↻
          </button>
          <button
            className={styles.headerIcon}
            onClick={handleLogout}
            title="로그아웃"
            aria-label="로그아웃"
          >
            ⎋
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'orders' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          신청자
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          폼 & 계좌 설정
        </button>
      </div>

      {activeTab === 'orders' && (
        <>
          {ordersLoading && <div className={styles.banner}>목록을 불러오는 중...</div>}
          {fetchError && <div className={styles.error}>{fetchError}</div>}

          <section className={styles.summaryGrid}>
            <div className={styles.card}>
              <p className={styles.cardLabel}>총 신청자</p>
              <p className={styles.cardValue}>{summary.total}명 ({summary.totalOrders}건)</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>확정 / 대기 / 취소</p>
              <p className={styles.cardValue}>
                {summary.statusCounts.confirmed} / {summary.statusCounts.pending} / {summary.statusCounts.cancelled}
              </p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>일정별 신청 (예약인원/건수)</p>
              <div className={styles.scheduleList}>
                {Object.entries(summary.scheduleCounts).map(([key, data]) => {
                  // Find capacity for this schedule
                  const schedConfig = config.schedules.find(s => s.time === key);
                  const capacity = schedConfig ? schedConfig.capacity : 100;
                  const isFull = data.people >= capacity;

                  return (
                    <div
                      key={key}
                      className={styles.scheduleItem}
                      onClick={() => setSelectedScheduleDetail(key)}
                    >
                      <span>{formatSchedule(key)}</span>
                      <span className={`${styles.countChip} ${isFull ? styles.fullChip : ''}`}>
                        {data.people}/{capacity}명 ({data.count}건)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={styles.filters}>
            <div className={styles.filterControl}>
              <label>검색 (이름/연락처)</label>
              <input
                type="text"
                value={searchTerm}
                placeholder="예) 홍길동 / 010"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterControl}>
              <label>상태</label>
              <div className={styles.chipRow}>
                {[
                  { label: '전체', value: '' },
                  { label: '확정', value: 'confirmed' },
                  { label: '대기', value: 'pending' },
                  { label: '취소', value: 'cancelled' },
                ].map((opt) => (
                  <button
                    key={opt.value || 'all'}
                    className={`${styles.chip} ${statusFilter === opt.value ? styles.activeChip : ''}`}
                    onClick={() => setStatusFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterControl}>
              <label>일정</label>
              <select value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)}>
                <option value="">전체</option>
                {config.schedules.map((schedule) => (
                  <option key={schedule.time} value={schedule.time}>
                    {formatSchedule(schedule.time)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>신청자 목록</h2>
              <span className={styles.badge}>{filteredOrders.length}명</span>
            </div>

            {filteredOrders.length === 0 && <p className={styles.muted}>조건에 맞는 신청자가 없습니다.</p>}

            <div className={styles.orderList}>
              {filteredOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderRow}>
                    <div>
                      <p className={styles.orderName}>
                        {order.name}
                        <span className={styles.peopleCount}>({order.people_count || 1}인)</span>
                      </p>
                      <p className={styles.orderMeta}>{order.phone}</p>
                    </div>
                    <span className={`${styles.status} ${styles[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </div>
                  <div className={styles.orderRow}>
                    <p className={styles.orderSchedule}>{formatSchedule(order.schedule)}</p>
                    <p className={styles.orderCreated}>
                      {new Date(order.created_at).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className={styles.orderRow}>
                    {order.total_amount > 0 && (
                      <p className={styles.orderAmount}>결제금액: {order.total_amount.toLocaleString()}원</p>
                    )}
                    <p className={styles.orderMeta}>
                      제품: {order.product_type === 'wreath' ? '리스' : '트리'}
                    </p>
                  </div>
                  <div className={styles.statusRow}>
                    <div className={styles.statusChips} role="group" aria-label="상태 변경">
                      {(['confirmed', 'pending', 'cancelled'] as OrderStatus[]).map((status) => (
                        <button
                          key={status}
                          className={`${styles.chip} ${order.status === status ? styles.activeChip : ''}`}
                          onClick={() => handleStatusChange(order.id, status)}
                          disabled={statusUpdatingId === order.id}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                    <button
                      className={styles.iconDelete}
                      onClick={() => handleDelete(order.id)}
                      disabled={statusUpdatingId === order.id}
                      title="삭제"
                      aria-label="신청 삭제"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Schedule Detail Modal */}
          {selectedScheduleDetail && (
            <div className={styles.modalOverlay} onClick={() => setSelectedScheduleDetail(null)}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>{formatSchedule(selectedScheduleDetail)} 신청자 목록</h3>
                  <button className={styles.closeButton} onClick={() => setSelectedScheduleDetail(null)}>
                    &times;
                  </button>
                </div>
                <table className={styles.modalTable}>
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>연락처</th>
                      <th>인원</th>
                      <th>제품</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o) => o.schedule === selectedScheduleDetail && o.status === 'confirmed')
                      .map((order) => (
                        <tr key={order.id}>
                          <td>{order.name}</td>
                          <td>{order.phone}</td>
                          <td>{order.people_count || 1}인</td>
                          <td>{order.product_type === 'wreath' ? '리스' : '트리'}</td>
                        </tr>
                      ))}
                    {orders.filter((o) => o.schedule === selectedScheduleDetail && o.status === 'confirmed').length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                          확정된 신청자가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>폼 설정</h2>
            <p className={styles.muted}>일정/안내/계좌 정보를 수정하면 즉시 공개 페이지에 반영됩니다.</p>
          </div>

          <div className={styles.configList}>
            {config.schedules.map((schedule, index) => {
              const match = schedule.time.match(/(\d{1,2})월\s*(\d{1,2})일.*?(\d{1,2}):(\d{2})/);
              const pad = (n: number) => n.toString().padStart(2, '0');
              const month = match ? Number(match[1]) : 1;
              const day = match ? Number(match[2]) : 1;
              const hour = match ? Number(match[3]) : 0;

              return (
                <div key={`${index}`} className={styles.configRow}>
                  <div className={styles.selectWrapperWide}>
                    <label>일정 {index + 1}</label>
                    <div className={styles.selectRow}>
                      <select
                        value={month}
                        onChange={(e) => handleSchedulePartChange(index, 'month', e.target.value)}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {m}월
                          </option>
                        ))}
                      </select>
                      <select
                        value={day}
                        onChange={(e) => handleSchedulePartChange(index, 'day', e.target.value)}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}일
                          </option>
                        ))}
                      </select>
                      <select
                        value={hour}
                        onChange={(e) => handleSchedulePartChange(index, 'hour', e.target.value)}
                      >
                        {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                          <option key={h} value={h}>
                            {pad(h)}시
                          </option>
                        ))}
                      </select>
                      <div className={styles.capacityInput}>
                        <span>정원:</span>
                        <input
                          type="number"
                          value={schedule.capacity}
                          onChange={(e) => handleSchedulePartChange(index, 'capacity', e.target.value)}
                          className={styles.smallInput}
                        />
                      </div>
                    </div>
                  </div>
                  {config.schedules.length > 1 && (
                    <button className={styles.removeButton} onClick={() => removeScheduleRow(index)}>
                      삭제
                    </button>
                  )}
                </div>
              );
            })}
            <Button variant="outline" size="medium" onClick={addScheduleRow}>
              일정 추가
            </Button>
          </div>

          <div className={styles.textareaGroup}>
            <label>세부 안내 문구</label>
            <textarea
              value={config.details}
              onChange={(e) => setConfig((prev) => ({ ...prev, details: e.target.value }))}
              rows={5}
            />
          </div>

          <div className={styles.gridTwo}>
            <Input
              label="은행명"
              value={config.bankName}
              onChange={(e) => setConfig((prev) => ({ ...prev, bankName: e.target.value }))}
              placeholder="예) 국민은행"
            />
            <Input
              label="예금주"
              value={config.depositor}
              onChange={(e) => setConfig((prev) => ({ ...prev, depositor: e.target.value }))}
              placeholder="예) 변화 x Piri Flore"
            />
          </div>
          <Input
            label="계좌번호"
            value={config.accountNumber}
            onChange={(e) => setConfig((prev) => ({ ...prev, accountNumber: e.target.value }))}
            placeholder="예) 1234-56-789012"
          />

          <div className={styles.gridTwo}>
            <Input
              label="1인 가격"
              value={config.price}
              onChange={(e) => setConfig((prev) => ({ ...prev, price: e.target.value.replace(/[^0-9]/g, '') }))}
              placeholder="예) 80000"
            />
            <Input
              label="2인 가격 (할인가)"
              value={config.price2}
              onChange={(e) => setConfig((prev) => ({ ...prev, price2: e.target.value.replace(/[^0-9]/g, '') }))}
              placeholder="예) 150000"
            />
          </div>

          <Input
            label="배경 이미지 URL"
            value={config.backgroundImage}
            onChange={(e) => setConfig((prev) => ({ ...prev, backgroundImage: e.target.value }))}
            placeholder="https://example.com/image.jpg"
          />

          <Button onClick={handleConfigSave} disabled={configSaving}>
            {configSaving ? '저장 중...' : '설정 저장'}
          </Button>
        </section>
      )}
    </main>
  );
}
