import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={`container ${styles.container}`}>
                <div className={styles.logoWrapper}>
                    <Link href="/" className={styles.logoLink}>
                        <span className={styles.logoText}>ByunHwa</span>
                    </Link>
                </div>    <nav className={styles.nav}>
                    <Link href="/" className={styles.navLink}>주문하기</Link>
                </nav>
            </div>
        </header>
    );
}
