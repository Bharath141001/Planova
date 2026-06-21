import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.scss';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onValueChange, onClear, placeholder = 'Search…', ...props }, ref) => (
    <div className={styles.root}>
      <span className={styles.iconWrap}>
        <Search size={16} aria-hidden="true" />
      </span>
      <input
        ref={ref}
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        {...props}
      />
      {value && (
        <button
          type="button"
          className={styles.clearBtn}
          aria-label="Clear search"
          onClick={() => { onValueChange(''); onClear?.(); }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
);
SearchBar.displayName = 'SearchBar';
