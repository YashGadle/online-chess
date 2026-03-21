import React from "react";
import Navbar from "./navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-base-100 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-secondary)_10%,transparent)_0%,transparent_50%)]">
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;
