import { useTheme } from '../context/ThemeContext';
import { Check, Palette, Sun, Moon } from 'lucide-react';

export default function Themes() {
  const { currentThemeId, setTheme, allThemes } = useTheme();

  const darkThemes = allThemes.filter(t => t.type === 'dark');
  const lightThemes = allThemes.filter(t => t.type === 'light');

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Themes
        </h1>
        <p className="mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Customize the look and feel of your workspace
        </p>
      </div>

      {/* Dark Themes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5" style={{ color: 'var(--theme-text-secondary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Dark Themes
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            background: 'var(--theme-badge-bg)',
            color: 'var(--theme-badge-text)',
            border: '1px solid var(--theme-badge-border)',
          }}>
            {darkThemes.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {darkThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentThemeId === theme.id}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </section>

      {/* Light Themes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5" style={{ color: 'var(--theme-text-secondary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Light Themes
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            background: 'var(--theme-badge-bg)',
            color: 'var(--theme-badge-text)',
            border: '1px solid var(--theme-badge-border)',
          }}>
            {lightThemes.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lightThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentThemeId === theme.id}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard({ theme, isActive, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="group relative text-left w-full p-4 rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: isActive ? 'var(--theme-sidebar-active-bg)' : 'var(--theme-bg-card)',
        border: isActive
          ? '2px solid var(--theme-accent)'
          : '1px solid var(--theme-border)',
        borderRadius: 'var(--theme-radius)',
        boxShadow: isActive ? 'var(--theme-shadow)' : 'none',
      }}
      aria-pressed={isActive}
      aria-label={'Select ' + theme.name + ' theme'}
    >
      {/* Active badge */}
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: 'var(--theme-accent)',
            color: '#ffffff',
          }}
        >
          <Check className="w-3 h-3" />
          Active
        </div>
      )}

      {/* Color preview swatches */}
      <div className="flex gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-lg border border-white/10"
          style={{ background: theme.preview.bg }}
          title="Background"
        />
        <div
          className="w-10 h-10 rounded-lg border border-white/10"
          style={{ background: theme.preview.accent }}
          title="Accent"
        />
        <div
          className="w-10 h-10 rounded-lg border border-white/10"
          style={{ background: theme.preview.card }}
          title="Card"
        />
        {/* Chart color mini swatches */}
        <div className="flex flex-col gap-0.5 justify-center ml-1">
          <div className="flex gap-0.5">
            {theme.chartColors.slice(0, 3).map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <div className="flex gap-0.5">
            {theme.chartColors.slice(3, 6).map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Theme info */}
      <h3 className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
        {theme.name}
      </h3>
      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--theme-text-muted)' }}>
        {theme.description}
      </p>

      {/* Hover indicator */}
      {!isActive && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            border: '1px solid var(--theme-border-hover)',
            borderRadius: 'var(--theme-radius)',
          }}
        />
      )}
    </button>
  );
}
