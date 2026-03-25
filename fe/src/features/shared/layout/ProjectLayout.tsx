import { Outlet } from "react-router-dom";
import Sidebar from "../components/ProjectSidebar";
import Navbar from "../components/ProjectNavbar";

export default function ProjectLayout() {
  return (
    <div className="h-screen flex bg-gray-50">

      {/* Sidebar mới */}
      <Sidebar activeMenu="board" />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>

      </div>
    </div>
  );
}