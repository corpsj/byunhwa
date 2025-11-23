'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { defaultFormConfig } from '@/lib/formDefaults';

type ScheduleOption = {
  time: string;
  capacity: number;
  reserved: number;
  remaining: number;
};

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Student Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [productType, setProductType] = useState('tree');

  // Class Schedule
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);

  // Agreement
  const [agreed, setAgreed] = useState(false);
  const [details, setDetails] = useState(defaultFormConfig.details);
  const [bankName, setBankName] = useState(defaultFormConfig.bankName);
  const [accountNumber, setAccountNumber] = useState(defaultFormConfig.accountNumber);
  const [depositor, setDepositor] = useState(defaultFormConfig.depositor);
  const [price, setPrice] = useState(defaultFormConfig.price);
  const [price2, setPrice2] = useState(defaultFormConfig.price2 || '150000');
  const [backgroundImage, setBackgroundImage] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setMounted(true);
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        // Handle schedules: could be string[] (legacy) or object[] (new)
        let loadedSchedules: ScheduleOption[] = [];
        if (Array.isArray(data.schedules)) {
          loadedSchedules = data.schedules.map((s: any) => {
            if (typeof s === 'string') {
              return { time: s, capacity: 100, reserved: 0, remaining: 100 };
            }
            return {
              time: s.time,
              capacity: s.capacity || 100,
              reserved: s.reserved || 0,
              remaining: typeof s.remaining === 'number' ? s.remaining : 100
            };
          });
        } else {
          loadedSchedules = defaultFormConfig.schedules.map(s => ({
            time: s, capacity: 100, reserved: 0, remaining: 100
          }));
        }

        setSchedules(loadedSchedules);
        setDetails(data.details || defaultFormConfig.details);
        setBankName(data.bankName || defaultFormConfig.bankName);
        setAccountNumber(data.accountNumber || defaultFormConfig.accountNumber);
        setDepositor(data.depositor || defaultFormConfig.depositor);
        setPrice(data.price || defaultFormConfig.price);
        setPrice2(data.price2 || defaultFormConfig.price2 || '150000');
        setBackgroundImage(data.backgroundImage || '');
      } catch (error) {
        console.error('Failed to load form config', error);
      }
    };

    fetchConfig();
  }, []);

  const formatSchedule = (value: string) => {
    const match = value.match(/(\d{1,2})월\s*(\d{1,2})일.*?(\d{1,2}):(\d{2})/);
    if (match) {
      const [, mmStr, ddStr, hhStr, minStr] = match;
      const mm = Number(mmStr);
      const dd = Number(ddStr);
      const hh = Number(hhStr);
      const minutes = Number(minStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const year = new Date().getFullYear();
      const d = new Date(`${year}-${pad(mm)}-${pad(dd)}T${pad(hh)}:${pad(minutes)}`);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayPart = Number.isNaN(d.getTime()) ? '' : ` (${dayNames[d.getDay()]})`;
      // Removed padding for month and day as requested
      return `${mm}월 ${dd}일${dayPart} ${pad(hh)}:${pad(minutes)}`;
    }
    return value;
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

  const currentPrice = peopleCount === 2 ? Number(price2) : Number(price);

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
          peopleCount,
          totalAmount: currentPrice,
          productType,
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
            <div className={styles.accountRow}>
              <div className={styles.account}>{accountNumber} {bankName}</div>
              <button
                className={styles.copyButton}
                onClick={() => {
                  navigator.clipboard.writeText(`${accountNumber} ${bankName}`);
                  alert('계좌번호가 복사되었습니다.');
                }}
              >
                복사
              </button>
            </div>
            <div className={styles.depositor}>예금주: {depositor}</div>
            <div className={styles.depositor}>금액: {currentPrice.toLocaleString('ko-KR')}원</div>
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
      {/* Background Image */}
      {backgroundImage && (
        <div
          className={styles.backgroundImage}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

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
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                let formatted = val;
                if (val.length > 3 && val.length <= 7) {
                  formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                } else if (val.length > 7) {
                  formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
                }
                setPhone(formatted);
              }}
              type="tel"
              inputMode="numeric" // Ensure numeric keypad
              required
              error={errors.phone}
            />

            <div className={styles.peopleSelect}>
              <label className={styles.inputLabel}>만들고 싶은 것</label>
              <div className={styles.radioGroupRow}>
                <label className={`${styles.radioLabelBox} ${productType === 'tree' ? styles.selectedBox : ''}`}>
                  <input
                    type="radio"
                    name="productType"
                    value="tree"
                    checked={productType === 'tree'}
                    onChange={() => setProductType('tree')}
                    className={styles.hiddenRadio}
                  />
                  <span>트리</span>
                </label>
                <label className={`${styles.radioLabelBox} ${productType === 'wreath' ? styles.selectedBox : ''}`}>
                  <input
                    type="radio"
                    name="productType"
                    value="wreath"
                    checked={productType === 'wreath'}
                    onChange={() => setProductType('wreath')}
                    className={styles.hiddenRadio}
                  />
                  <span>리스</span>
                </label>
              </div>
            </div>

            <div className={styles.peopleSelect}>
              <label className={styles.inputLabel}>신청 인원</label>
              <div className={styles.radioGroupRow}>
                <label className={`${styles.radioLabelBox} ${peopleCount === 1 ? styles.selectedBox : ''}`}>
                  <input
                    type="radio"
                    name="peopleCount"
                    value={1}
                    checked={peopleCount === 1}
                    onChange={() => setPeopleCount(1)}
                    className={styles.hiddenRadio}
                  />
                  <span>1인 ({Number(price).toLocaleString()}원)</span>
                </label>
                <label className={`${styles.radioLabelBox} ${peopleCount === 2 ? styles.selectedBox : ''}`}>
                  <input
                    type="radio"
                    name="peopleCount"
                    value={2}
                    checked={peopleCount === 2}
                    onChange={() => setPeopleCount(2)}
                    className={styles.hiddenRadio}
                  />
                  <span>2인 ({Number(price2).toLocaleString()}원) <span className={styles.discountBadge}>할인</span></span>
                </label>
              </div>
            </div>
          </div>

          {/* Class Schedule */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>02. 수강 희망 일정 (택 1)</h3>
            <div className={styles.radioGroup}>
              {schedules.map((schedule) => {
                const isSoldOut = schedule.remaining < peopleCount;
                return (
                  <label
                    key={schedule.time}
                    className={`${styles.radioLabel} ${selectedSchedule === schedule.time ? styles.selected : ''} ${isSoldOut ? styles.disabled : ''}`}
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value={schedule.time}
                      checked={selectedSchedule === schedule.time}
                      onChange={(e) => setSelectedSchedule(e.target.value)}
                      className={styles.radioInput}
                      disabled={isSoldOut}
                    />
                    <div className={styles.scheduleInfo}>
                      <span className={styles.scheduleDate}>{formatSchedule(schedule.time)}</span>
                      <div className={styles.scheduleRight}>
                        <span className={styles.remainingSeats}>
                          {isSoldOut ? '마감' : `${schedule.remaining}석 남음`}
                        </span>
                        <span className={`${styles.statusBadge} ${isSoldOut ? styles.badgeSoldOut : styles.badgeAvailable}`}>
                          {isSoldOut ? '마감' : '예약 가능'}
                        </span>
                      </div>
                    </div>
                    {selectedSchedule === schedule.time && <span className={styles.checkIcon}>✓</span>}
                  </label>
                );
              })}
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
            {isSubmitting ? '신청 중...' : `${currentPrice.toLocaleString()}원 결제하기`}
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
