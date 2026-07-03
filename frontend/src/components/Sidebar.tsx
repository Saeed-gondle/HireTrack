import { auth } from "@/lib/auth";
import { getNavLinks, getNotLoggedInNavLinks } from "@/lib/navlinks";
import Navlinks from "./Navlinks";
import ProfileActons from "./ProfileActons";
import Logo from "./Logo";

async function Sidebar() {
  const session = await auth();
  const navLinks = session?.user
    ? getNavLinks(session?.user?.role!)
    : getNotLoggedInNavLinks();
  return (
    <div className="flex flex-col items-start justify-between gap-8">
      <Logo />
      <nav className="w-full">
        <Navlinks links={navLinks} />
      </nav>
      {session?.user && <ProfileActons />}
    </div>
  );
}

export default Sidebar;
