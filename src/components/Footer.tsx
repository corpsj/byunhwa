import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <p>&copy; {new Date().getFullYear()} Byunhwa. All rights reserved.</p>
                <div className={styles.contact}>
                    <a href="https://www.instagram.com/bye.on.hwa/" target="_blank" rel="noopener noreferrer">
                        Instagram: @bye.on.hwa
                    </a>
                    <p>Tel: 010-1234-5678</p>
                </div>
            </div>
        </footer>
    );
}
