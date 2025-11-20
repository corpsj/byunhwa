import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logoWrapper}>
                    <Image
                        src="/logo.png"
                        alt="Byunhwa Logo"
                        width={120}
                        height={40}
                        className={styles.logoImage}
                        priority
                    />
                </Link>
                <nav className={styles.nav}>
                    <Link href="/" className={styles.navLink}>주문하기</Link>
                </nav>
            </div>
        </header>
    );
}
