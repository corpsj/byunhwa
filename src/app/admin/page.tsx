'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './admin.module.css';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { defaultFormConfig } from '@/lib/formDefaults';

type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

type Order = {
  id: string;
  name: string;
  phone: string;
  schedule: string;
  agreed: boolean;
  status: OrderStatus;
  created_at: string;
};

type FormConfig = {
  schedules: string[];
  details: string;
  bankName: string;
  accountNumber: string;
  depositor: string;
  price: string;
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
  const [fetchError, setFetchError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');

  const [config, setConfig] = useState<FormConfig>({
    schedules: defaultFormConfig.schedules,
    details: defaultFormConfig.details,
    bankName: defaultFormConfig.bankName,
    accountNumber: defaultFormConfig.accountNumber,
    depositor: defaultFormConfig.depositor,
    price: defaultFormConfig.price,
  });
  const [configSaving, setConfigSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setConfig({
        schedules:
          Array.isArray(data.schedules) && data.schedules.length > 0
            ? data.schedules
            : defaultFormConfig.schedules,
        details: data.details || defaultFormConfig.details,
        bankName: data.bankName || defaultFormConfig.bankName,
        accountNumber: data.accountNumber || defaultFormConfig.accountNumber,
        depositor: data.depositor || defaultFormConfig.depositor,
        price: data.price || defaultFormConfig.price,
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

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const formatSchedule = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      try {
        return new Date(value).toLocaleDateString('ko-KR', { dateStyle: 'medium' });
      } catch {
        return value;
      }
    }
    return value;
  };

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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesSchedule = scheduleFilter ? order.schedule === scheduleFilter : true;
      return matchesStatus && matchesSchedule;
    });
  }, [orders, statusFilter, scheduleFilter]);

  const summary = useMemo(() => {
    const statusCounts: Record<string, number> = { pending: 0, confirmed: 0, cancelled: 0 };
    const scheduleCounts: Record<string, number> = {};

    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      const key = order.schedule || '미지정';
      scheduleCounts[key] = (scheduleCounts[key] || 0) + 1;
    });

    return {
      total: orders.length,
      statusCounts,
      scheduleCounts,
    };
  }, [orders]);

  const handleConfigChange = (index: number, value: string) => {
    setConfig((prev) => {
      const updated = [...prev.schedules];
      updated[index] = value;
      return { ...prev, schedules: updated };
    });
  };

  const addScheduleRow = () => {
    setConfig((prev) => ({ ...prev, schedules: [...prev.schedules, ''] }));
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
          <h1 className={styles.title}>수강 신청 관리</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" size="medium" onClick={handleLogout}>
            로그아웃
          </Button>
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
              <p className={styles.cardValue}>{summary.total}명</p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardLabel}>확정 / 대기 / 취소</p>
              <p className={styles.cardValue}>
                {summary.statusCounts.confirmed} / {summary.statusCounts.pending} / {summary.statusCounts.cancelled}
              </p>
            </div>
          <div className={styles.card}>
            <p className={styles.cardLabel}>일정별 신청</p>
            <div className={styles.scheduleList}>
              {Object.entries(summary.scheduleCounts).map(([key, count]) => (
                <div key={key} className={styles.scheduleItem}>
                  <span>{formatSchedule(key)}</span>
                  <span className={styles.countChip}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          </section>

          <section className={styles.filters}>
            <div className={styles.filterControl}>
              <label>상태</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">전체</option>
                <option value="pending">대기</option>
                <option value="confirmed">확정</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
            <div className={styles.filterControl}>
              <label>일정</label>
              <select value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)}>
                <option value="">전체</option>
                {config.schedules.map((schedule) => (
                  <option key={schedule} value={schedule}>
                    {schedule}
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
                      <p className={styles.orderName}>{order.name}</p>
                      <p className={styles.orderMeta}>{order.phone}</p>
                    </div>
                    <span className={`${styles.status} ${styles[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  </div>
                  <div className={styles.orderRow}>
                    <p className={styles.orderMeta}>{order.schedule}</p>
                    <p className={styles.orderMeta}>
                      {new Date(order.created_at).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className={styles.compactActions}>
                    <label htmlFor={`status-${order.id}`}>상태 변경</label>
                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      disabled={statusUpdatingId === order.id}
                    >
                      <option value="confirmed">확정</option>
                      <option value="pending">대기</option>
                      <option value="cancelled">취소</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === 'settings' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>폼 설정</h2>
            <p className={styles.muted}>일정/안내/계좌 정보를 수정하면 즉시 공개 페이지에 반영됩니다.</p>
          </div>

          <div className={styles.configList}>
            {config.schedules.map((schedule, index) => (
              <div key={`${schedule}-${index}`} className={styles.configRow}>
                <Input
                  label={`일정 ${index + 1}`}
                  type="date"
                  value={schedule}
                  onChange={(e) => handleConfigChange(index, e.target.value)}
                  placeholder="예) 2024-12-24"
                />
                {config.schedules.length > 1 && (
                  <button className={styles.removeButton} onClick={() => removeScheduleRow(index)}>
                    삭제
                  </button>
                )}
              </div>
            ))}
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
              placeholder="예) 변화 x PIRI"
            />
          </div>
          <Input
            label="계좌번호"
            value={config.accountNumber}
            onChange={(e) => setConfig((prev) => ({ ...prev, accountNumber: e.target.value }))}
            placeholder="예) 1234-56-789012"
          />
          <Input
            label="가격"
            value={config.price}
            onChange={(e) => setConfig((prev) => ({ ...prev, price: e.target.value.replace(/[^0-9]/g, '') }))}
            placeholder="예) 80000"
          />

          <Button onClick={handleConfigSave} disabled={configSaving}>
            {configSaving ? '저장 중...' : '설정 저장'}
          </Button>
        </section>
      )}
    </main>
  );
}
