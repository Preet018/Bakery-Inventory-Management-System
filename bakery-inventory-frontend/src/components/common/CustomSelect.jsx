import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect Component
 *
 * A fully styled, accessible custom dropdown component that replaces
 * native browser select menus with a branded, theme-consistent UI.
 *
 * @param {Array} options - List of { value, label, icon? } or primitives
 * @param {any} value - Currently selected value
 * @param {Function} onChange - Callback invoked with selected value
 * @param {React.ReactNode} icon - Optional icon rendered before the label
 * @param {string} placeholder - Default placeholder text
 * @param {string} className - Additional CSS classes
 * @param {string} id - HTML ID for accessibility
 */
export const CustomSelect = ({
  options = [],
  value,
  onChange,
  icon,
  placeholder = 'Select...',
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to { value, label } format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label || opt.name || String(opt.value),
        icon: opt.icon,
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = normalizedOptions.findIndex(
        (opt) => String(opt.value) === String(value)
      );
      const nextIndex =
        currentIndex < normalizedOptions.length - 1 ? currentIndex + 1 : 0;
      onChange(normalizedOptions[nextIndex].value);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = normalizedOptions.findIndex(
        (opt) => String(opt.value) === String(value)
      );
      const prevIndex =
        currentIndex > 0 ? currentIndex - 1 : normalizedOptions.length - 1;
      onChange(normalizedOptions[prevIndex].value);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? 'is-open' : ''} ${className}`}
      id={id}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="custom-select-value-wrapper">
          {icon && <span className="custom-select-prefix-icon">{icon}</span>}
          <span className="custom-select-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`custom-select-chevron ${isOpen ? 'rotate' : ''}`}
        />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          <ul className="custom-select-options-list">
            {normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <li
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="custom-option-label">{opt.label}</span>
                  {isSelected && <Check size={14} className="custom-option-check" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
