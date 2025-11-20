'use client';

import { useState, FormEvent } from 'react';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import styles from './page.module.css';

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setOrderSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const resetOrder = () => {
    setOrderSuccess(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          당신의 마음을 담은<br />
          <span className={styles.highlight}>변화</span>의 꽃
        </h1>
        <p className={styles.subtitle}>
          특별한 날, 소중한 사람에게<br />
          세상에 하나뿐인 꽃을 선물하세요.
        </p>
      </section>

      {orderSuccess ? (
        <div className={styles.successContainer}>
          <div className={styles.successCard}>
            <div className={styles.icon}>✓</div>
            <h2 className={styles.successTitle}>주문이 접수되었습니다</h2>
            <p className={styles.successMessage}>
              아래 계좌로 입금해 주시면<br />
              확인 후 제작이 진행됩니다.
            </p>

            <div className={styles.bankInfo}>
              <p className={styles.bankLabel}>입금 계좌 안내</p>
              <p className={styles.account}>신한은행 110-000-000000</p>
              <p className={styles.depositor}>예금주: 변화(홍길동)</p>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" onClick={resetOrder}>추가 주문하기</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.orderContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. 주문자 정보</h2>
              <Input label="성함" name="senderName" placeholder="홍길동" required />
              <Input label="연락처" name="senderPhone" placeholder="010-0000-0000" required />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. 받으시는 분 정보</h2>
              <Input label="성함" name="recipientName" placeholder="김철수" required />
              <Input label="연락처" name="recipientPhone" placeholder="010-0000-0000" required />
              <Input label="주소" name="address" placeholder="서울시 강남구..." required />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. 배송 정보</h2>
              <div className={styles.row}>
                <Input label="배송 날짜" name="deliveryDate" type="date" required />
                <Input label="배송 시간" name="deliveryTime" type="time" required />
              </div>
              <Select
                label="배송 방법"
                name="deliveryMethod"
                required
                options={[
                  { value: 'pickup', label: '매장 픽업' },
                  { value: 'quick', label: '퀵 배송 (서울/경기)' },
                  { value: 'parcel', label: '택배 (전국)' },
                ]}
              />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. 상품 정보</h2>
              <Select
                label="상품 종류"
                name="productType"
                required
                options={[
                  { value: 'bouquet', label: '꽃다발' },
                  { value: 'basket', label: '꽃바구니' },
                  { value: 'box', label: '플라워 박스' },
                  { value: 'vase', label: '화병 꽂이' },
                ]}
              />
              <Select
                label="가격대"
                name="priceRange"
                required
                options={[
                  { value: '50000', label: '50,000원 ~' },
                  { value: '80000', label: '80,000원 ~' },
                  { value: '100000', label: '100,000원 ~' },
                  { value: '150000', label: '150,000원 ~' },
                  { value: 'custom', label: '상담 후 결정' },
                ]}
              />
              <Input
                label="원하시는 색감이나 스타일"
                name="style"
                placeholder="예: 파스텔톤으로 화사하게, 핑크&화이트 조합 등"
              />
              <div className={styles.textareaWrapper}>
                <label className={styles.label}>메시지 카드 내용</label>
                <textarea
                  className={styles.textarea}
                  name="message"
                  placeholder="카드에 적을 내용을 입력해 주세요."
                  rows={4}
                />
              </div>
            </section>

            <div className={styles.submitWrapper}>
              <Button type="submit" size="large" fullWidth disabled={isSubmitting}>
                {isSubmitting ? '주문 제출 중...' : '주문하기'}
              </Button>
              <p className={styles.notice}>
                * 주문 제출 후 입금 안내가 표시됩니다.
              </p>
            </div>
          </form>
        </div>
      )}

      <section className={styles.features}>
        <div className={styles.featureItem}>
          <h3>Custom Made</h3>
          <p>원하시는 색감과 스타일로<br />정성껏 제작해 드립니다.</p>
        </div>
        <div className={styles.featureItem}>
          <h3>Fresh Flowers</h3>
          <p>매일 아침 들어오는<br />신선한 꽃만을 사용합니다.</p>
        </div>
        <div className={styles.featureItem}>
          <h3>Delivery</h3>
          <p>원하시는 날짜와 시간에<br />안전하게 배송해 드립니다.</p>
        </div>
      </section>
    </div>
  );
}
