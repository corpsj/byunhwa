import React, { forwardRef } from 'react';
import styles from './Input.module.css'; // Reusing Input styles for consistency

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string; label: string }[];
    error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, options, error, className = '', ...props }, ref) => {
        return (
            <div className={`${styles.wrapper} ${className}`}>
                <label className={styles.label}>
                    {label} {props.required && <span className={styles.required}>*</span>}
                </label>
                <select
                    ref={ref}
                    className={`${styles.input} ${error ? styles.hasError : ''}`}
                    {...props}
                >
                    <option value="">선택해주세요</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <span className={styles.errorMessage}>{error}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
