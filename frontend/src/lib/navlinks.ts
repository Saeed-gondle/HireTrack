import { NavlinkItem } from "@/types/reactTypes";

export function getNavLinks(role: string): NavlinkItem[] {
  if (role === "ADMIN")
    return [...getRecruiterLinks().filter((link) => link.name !== "Settings" && link.name !== "Dashboard" && link.name !== "Analytics"), ...getAdminNavLinks()];
  if (role === "RECRUITER")
    return getRecruiterLinks()
  if (role === "CANDIDATE")
    return getUserLinks()


  return [];
}
export function getNotLoggedInNavLinks(): NavlinkItem[] {
  return [
    { name: "Login", href: "/login", icon: "login" },
    { name: "Sign Up", href: "/signup", icon: "shield" },
  ];
}
const getAdminNavLinks = (): NavlinkItem[] => {
  return [
    { name: "Admin Dashboard", href: "/admin/dashboard", icon: "home" },
    { name: "User Management", href: "/admin/users", icon: "userGroup" },
    { name: "Job Management", href: "/admin/jobs", icon: "wrench" },
    { name: "Analytics", href: "/admin/analytics", icon: "chart" },
    { name: "Settings", href: "/admin/settings", icon: "settings" },
  ];
};
const getRecruiterLinks = (): NavlinkItem[] => {
  return [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "Jobs", href: "/Jobs", icon: "briefcase" },
    { name: "Pipeline", href: "/pipeline", icon: "queue" },
    { name: "Candidates", href: "/candidates", icon: "users" },
    { name: "Interviews", href: "/interviews", icon: "userPlus" },
    { name: "Analytics", href: "/analytics", icon: "chart" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];
};
const getUserLinks = (): NavlinkItem[] => {
  return [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "Browse Jobs", href: "/jobs", icon: "briefcase" },
    { name: "My Applications", href: "/applications", icon: "doc" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];
};