'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Student Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Class Schedule
  const [selectedSchedule, setSelectedSchedule] = useState('');

  // Agreement
  const [agreed, setAgreed] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setOrderSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className={styles.account}>국민은행 1234-56-789012</div>
            <div className={styles.depositor}>예금주: 변화(ByunHwa)</div>
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

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <div>
              <h3>1:1 Coaching</h3>
              <p>초보자도 쉽게 따라할 수 있는<br />세심한 지도</p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <div>
              <h3>Premium Materials</h3>
              <p>오랫동안 감상할 수 있는<br />최고급 소재 사용</p>
            </div>
          </div>
        </div>
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
              {[
                '12월 20일 (금) 19:00',
                '12월 21일 (토) 14:00',
                '12월 22일 (일) 14:00'
              ].map((schedule) => (
                <label key={schedule} className={`${styles.radioLabel} ${selectedSchedule === schedule ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="schedule"
                    value={schedule}
                    checked={selectedSchedule === schedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>{schedule}</span>
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
              <p className={styles.agreementText}>
                <strong>[알러지 및 주의사항]</strong><br />
                - 생화 및 식물 소재를 다루므로 꽃가루 알러지가 있으신 분은 주의가 필요합니다.<br />
                - 수업 시작 3일 전까지 100% 환불 가능하며, 이후에는 재료 준비로 인해 환불이 불가합니다.<br />
                - 수업 시작 10분 전까지 도착해주시기 바랍니다.
              </p>
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
          <p className={styles.notice}>
            신청 후 입금 순으로 확정됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
