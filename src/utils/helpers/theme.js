// Tema: UCH CRM kimi default qaranlıq, istəyə görə açıq. Seçim localStorage-da saxlanılır.
const KEY = "addim-theme";

export const getTheme = () => document.documentElement.getAttribute("data-theme") || "dark";

export const setTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#e9e8ed" : "#17171b");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* gizli rejimdə yaddaş olmaya bilər */
  }
};

export const toggleTheme = () => setTheme(getTheme() === "light" ? "dark" : "light");
