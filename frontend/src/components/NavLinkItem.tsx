"use client";
import { NavlinkItem } from "@/types/reactTypes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiArrowLeftOnRectangle,
  HiChartBarSquare,
  HiCog6Tooth,
  HiDocumentText,
  HiHome,
  HiQueueList,
  HiUsers,
  HiUserPlus,
  HiWrenchScrewdriver,
  HiBriefcase,
  HiShieldCheck,
  HiUserGroup,
} from "react-icons/hi2";
const iconMap = {
  home: HiHome,
  briefcase: HiBriefcase,
  queue: HiQueueList,
  users: HiUsers,
  userPlus: HiUserPlus,
  chart: HiChartBarSquare,
  settings: HiCog6Tooth,
  doc: HiDocumentText,
  login: HiArrowLeftOnRectangle,
  shield: HiShieldCheck,
  wrench: HiWrenchScrewdriver,
  userGroup: HiUserGroup,
} as const;
function NavLinkItem({ link }: { link: NavlinkItem }) {
  const { icon } = link;
  const IconComponent = iconMap[icon];
  const pathname = usePathname();

  // Determine if the link is active
  const isActive =
    pathname === link.href || pathname.startsWith(`${link.href}/`);
  return (
    <li className="">
      <Link
        href={link.href}
        className={` flex items-center gap-3 px-4 py-2.5 rounded-lg text-lg font-medium
          transition-colors duration-150 ${
            isActive
              ? "bg-primary-50 text-primary-700 border-l-4 border-primary-500"
              : "text-gray-50 hover:bg-gray-100 hover:text-gray-900"
          }`}
      >
        <IconComponent className="text-xl font-bold" />
        {link.name}
      </Link>
    </li>
  );
}

export default NavLinkItem;
