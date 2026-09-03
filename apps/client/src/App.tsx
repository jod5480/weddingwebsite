import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/auth/Index";
import Index from "./pages/home/Index";
import NotFound from "./pages/not-found/Index";
import { useEffect } from "react";
import Lenis from "lenis";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // F12 & Developer Tools Protection
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key ? e.key.toUpperCase() : "";
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      // 1. Block F12
      if (key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 2. Block Ctrl+Shift+I / J / C (Windows/Linux) & Cmd+Option+I / J / C (Mac)
      if (
        (isCtrlOrMeta && isShift && (key === "I" || key === "J" || key === "C")) ||
        (e.metaKey && isAlt && (key === "I" || key === "J" || key === "C"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 3. Block Ctrl+U (View Page Source)
      if (isCtrlOrMeta && key === "U") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 4. Block Ctrl+S (Save Page)
      if (isCtrlOrMeta && key === "S") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Block right-click context menu (except inside text inputs)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return; // Allow guest to paste/edit in form fields
      }
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      lenis.destroy();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
