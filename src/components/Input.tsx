import React, { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className={`${styles.wrapper} ${className}`}>
                <label className={styles.label}>
                    {label} {props.required && <span className={styles.required}>*</span>}
                </label>
                <input
                    ref={ref}
                    className={`${styles.input} ${error ? styles.hasError : ''}`}
                    {...props}
                />
                {error && <span className={styles.errorMessage}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
