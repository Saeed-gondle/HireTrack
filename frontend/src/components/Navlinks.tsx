import NavLinkItem from "./NavLinkItem";
import { NavlinkItem } from "@/types/reactTypes";
function Navlinks({ links }: { links: NavlinkItem[] }) {
  return (
    <ul className="flex flex-col justify-center">
      {links.map((link) => (
        <NavLinkItem key={link.name} link={link} />
      ))}
    </ul>
  );
}

export default Navlinks;
