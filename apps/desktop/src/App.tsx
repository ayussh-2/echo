import { useState, useEffect, type ReactElement } from "react";
import { ToastView } from "./views/ToastView";
import { InboxView } from "./views/InboxView";
import { PairView } from "./views/PairView";

export function App(): ReactElement {
  const [currentView, setCurrentView] = useState<"toast" | "inbox" | "pair">(
    "toast",
  );

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "toast" || hash === "inbox" || hash === "pair") {
      setCurrentView(hash);
    }

    const handleHashChange = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "toast" || h === "inbox" || h === "pair") {
        setCurrentView(h);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="w-screen h-screen bg-transparent">
      {currentView === "toast" && <ToastView />}
      {currentView === "inbox" && <InboxView />}
      {currentView === "pair" && <PairView />}
    </div>
  );
}
