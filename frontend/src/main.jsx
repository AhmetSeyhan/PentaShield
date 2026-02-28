import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import ScannerUltraLanding from "./Landing.jsx";
import ScanDashboard from "./Dashboard.jsx";

function App() {
  const [page, setPage] = useState(
    window.location.hash === "#/scan" ? "dashboard" : "landing"
  );

  const goToDashboard = () => {
    window.location.hash = "#/scan";
    setPage("dashboard");
  };

  const goToHome = () => {
    window.location.hash = "#/";
    setPage("landing");
  };

  if (page === "dashboard") {
    return <ScanDashboard onGoHome={goToHome} />;
  }

  // Inject navigation into Landing page CTA buttons via event delegation
  return (
    <div onClick={(e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const txt = btn.textContent || "";
      if (
        txt.includes("Start Free Trial") ||
        txt.includes("View Live Demo") ||
        txt.includes("Get Started") ||
        txt.includes("Start Free") ||
        txt.includes("Start Free Trial")
      ) {
        goToDashboard();
      }
    }}>
      <ScannerUltraLanding />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
