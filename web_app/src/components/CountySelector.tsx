import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';
import { KENYA_COUNTIES, TOP_SERICULTURE_COUNTIES } from '../constants';

interface CountySelectorProps {
  value: string;
  onChange: (county: string) => void;
  label?: string;
  required?: boolean;
}

export const CountySelector: React.FC<CountySelectorProps> = ({
  value,
  onChange,
  label = 'County',
  required = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      // Focus search input on open
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (county: string) => {
    onChange(county);
    setIsOpen(false);
    setSearchQuery('');
  };

  const filteredCounties = KENYA_COUNTIES.filter((c) =>
    c.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="form-group county-selector-wrapper" ref={containerRef} style={{ position: 'relative' }}>
      <label className="form-label">
        {label} {required && '*'}
      </label>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-control county-trigger-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          backgroundColor: '#ffffff',
          fontWeight: 600,
          color: 'var(--text-main)',
          padding: '8px 12px',
          minHeight: '42px',
          borderColor: isOpen ? 'var(--primary)' : 'var(--border-card)',
          boxShadow: isOpen ? '0 0 0 2px var(--primary-subtle)' : 'none',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span>{value || 'Select County'}</span>
        </span>
        <ChevronDown
          size={16}
          color="var(--text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* 1-Tap Quick Select Pills for Top Sericulture Counties */}
      <div style={{ marginTop: '6px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
          Quick Select Sericulture Zones:
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
          }}
        >
          {TOP_SERICULTURE_COUNTIES.slice(0, 8).map((c) => {
            const isSelected = value === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleSelect(c)}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected && <Check size={11} />}
                <span>{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Searchable Dropdown Menu */}
      {isOpen && (
        <div
          className="county-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 110,
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--border-divider)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Kenya county (e.g. Kiambu, Machakos)..."
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                padding: '4px 0',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Counties List */}
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px 0',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {filteredCounties.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No county matching "{searchQuery}"
              </div>
            ) : (
              filteredCounties.map((c) => {
                const isSelected = value === c;
                const isMajor = TOP_SERICULTURE_COUNTIES.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none',
                      background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: '38px',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f7f5';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span>{c}</span>
                      {isMajor && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: isSelected ? 'var(--primary)' : 'var(--accent-gold-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--status-warning)',
                            fontWeight: 600,
                          }}
                        >
                          Sericulture Hub
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={16} color="var(--primary)" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count indicator */}
          <div
            style={{
              padding: '5px 12px',
              borderTop: '1px solid var(--border-divider)',
              backgroundColor: '#fafafa',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Showing {filteredCounties.length} of 47 counties</span>
            <span>Single tap to select</span>
          </div>
        </div>
      )}
    </div>
  );
};
