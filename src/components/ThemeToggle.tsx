import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-full justify-start h-10 px-4"
    >
      <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 left-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="ml-6 dark:hidden">Светлая тема</span>
      <span className="ml-6 hidden dark:inline">Темная тема</span>
    </Button>
  );
}
