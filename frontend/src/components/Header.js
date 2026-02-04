export default function Header({ title, darkMode, setDarkMode }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>

      {setDarkMode && (
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle theme"
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      )}
    </div>
  );
}