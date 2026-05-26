import { memo, useState, useCallback, useEffect, useRef } from 'react';

function SearchFilterBar({
  onSearch,
  onSort,
  placeholder = 'Search...',
  sortOptions = [],
  filters = [],
  onFilterChange,
  activeFilters = [],
}) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch?.('');
  }, [onSearch]);

  const handleSortChange = useCallback((e) => {
    const value = e.target.value;
    setSortBy(value);
    onSort?.(value);
  }, [onSort]);

  const handleFilterClick = useCallback((filter) => {
    onFilterChange?.(filter);
  }, [onFilterChange]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="w-full bg-dark-800/40 border border-dark-600 text-dark-200 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            aria-label={placeholder}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-dark-200 p-1"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="bg-dark-800/40 border border-dark-600 text-dark-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            aria-label="Sort by"
          >
            <option value="">Sort by...</option>
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Filter Chips */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filters">
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => handleFilterClick(filter.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilters.includes(filter.value)
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'bg-dark-800/40 text-purple-300/50 border border-dark-600 hover:border-dark-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(SearchFilterBar);
