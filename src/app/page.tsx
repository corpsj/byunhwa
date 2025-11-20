'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { defaultFormConfig } from '@/lib/formDefaults';

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Student Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Class Schedule
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [schedules, setSchedules] = useState<string[]>(defaultFormConfig.schedules);

  // Agreement
  const [agreed, setAgreed] = useState(false);
  const [details, setDetails] = useState(defaultFormConfig.details);
  const [bankName, setBankName] = useState(defaultFormConfig.bankName);
  const [accountNumber, setAccountNumber] = useState(defaultFormConfig.accountNumber);
  const [depositor, setDepositor] = useState(defaultFormConfig.depositor);
  const [price, setPrice] = useState(defaultFormConfig.price);

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setMounted(true);
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setSchedules(Array.isArray(data.schedules) && data.schedules.length > 0 ? data.schedules : defaultFormConfig.schedules);
        setDetails(data.details || defaultFormConfig.details);
        setBankName(data.bankName || defaultFormConfig.bankName);
        setAccountNumber(data.accountNumber || defaultFormConfig.accountNumber);
        setDepositor(data.depositor || defaultFormConfig.depositor);
        setPrice(data.price || defaultFormConfig.price);
      } catch (error) {
        console.error('Failed to load form config', error);
      }
    };

    fetchConfig();
  }, []);

  const formatSchedule = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일 (${dayNames[d.getDay()]}) ${pad(d.getHours())}시`;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = '수강생 성함을 입력해주세요.';
    if (!phone.trim()) newErrors.phone = '연락처를 입력해주세요.';
    if (!selectedSchedule) newErrors.schedule = '수강 희망 날짜를 선택해주세요.';
    if (!agreed) newErrors.agreement = '주의사항에 동의해주세요.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          schedule: selectedSchedule,
          agreed,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || '신청에 실패했습니다. 다시 시도해주세요.');
      }

      setOrderSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '신청에 실패했습니다. 다시 시도해주세요.';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setOrderSuccess(false);
    setName('');
    setPhone('');
    setSelectedSchedule('');
    setAgreed(false);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) return null;

  // Success State
  if (orderSuccess) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <div className={styles.icon}>🎄</div>
          <h2 className={styles.successTitle}>신청이 완료되었습니다!</h2>
          <p className={styles.successMessage}>
            크리스마스 트리 원데이 클래스 신청이 접수되었습니다.<br />
            입금 확인 후 확정 문자를 보내드립니다.
          </p>

          <div className={styles.bankInfo}>
            <div className={styles.bankLabel}>입금 계좌 안내</div>
            <div className={styles.account}>{bankName} {accountNumber}</div>
            <div className={styles.depositor}>예금주: {depositor}</div>
            <div className={styles.depositor}>금액: {Number(price || 0).toLocaleString('ko-KR')}원</div>
          </div>

          <div className={styles.actions}>
            <Button onClick={resetOrder} variant="outline" size="medium">
              추가 신청하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Form State
  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Christmas<br />
          <span className={styles.highlight}>Tree Class</span>
        </h1>
        <p className={styles.subtitle}>
          나만의 크리스마스 트리를 만드는<br />
          특별한 원데이 클래스에 초대합니다.
        </p>


      </section>

      {/* Application Form */}
      <div className={styles.orderContainer} id="order-form">
        <h2 className={styles.formTitle}>Class Application</h2>
        <p className={styles.formDescription}>
          아래 양식을 작성하여 클래스를 신청해주세요.
        </p>

        <div className={styles.form}>
          {/* Student Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>01. 수강생 정보</h3>
            <Input
              label="성함"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              error={errors.name}
            />
            <Input
              label="연락처"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              required
              error={errors.phone}
            />
          </div>

          {/* Class Schedule */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>02. 수강 희망 일정 (택 1)</h3>
            <div className={styles.radioGroup}>
              {schedules.map((schedule) => (
                <label key={schedule} className={`${styles.radioLabel} ${selectedSchedule === schedule ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="schedule"
                    value={schedule}
                    checked={selectedSchedule === schedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>{formatSchedule(schedule)}</span>
                  {selectedSchedule === schedule && <span className={styles.checkIcon}>✓</span>}
                </label>
              ))}
            </div>
            {errors.schedule && <div className={styles.errorMessage}>{errors.schedule}</div>}
          </div>

          {/* Agreement */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>03. 주의사항 동의</h3>
            <div className={styles.agreementBox}>
              <div className={styles.agreementText}>
                {details.split('\n').map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxText}>위 내용을 확인하였으며 동의합니다. (필수)</span>
              </label>
            </div>
            {errors.agreement && <div className={styles.errorMessage}>{errors.agreement}</div>}
          </div>
        </div>

        {/* Sticky Submit Button */}
        <div className={styles.submitWrapper}>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            fullWidth
            size="large"
          >
            {isSubmitting ? '신청 중...' : '클래스 신청하기'}
          </Button>
          {submissionError && <p className={styles.submitError}>{submissionError}</p>}
          <p className={styles.notice}>
            신청 후 입금 순으로 확정됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
