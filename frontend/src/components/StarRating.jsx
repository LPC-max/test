import React from 'react';

export default function StarRating({ value, onChange, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const sz = size === 'sm' ? 'text-sm' : 'text-lg';

  if (!onChange) {
    return (
      <span className={`inline-flex gap-0.5 ${sz}`}>
        {stars.map(s => (
          <span key={s} className={s <= value ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        ))}
      </span>
    );
  }

  return (
    <span className={`inline-flex gap-0.5 ${sz}`}>
      {stars.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s === value ? null : s)}
          className={`transition-colors ${s <= (value || 0) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
