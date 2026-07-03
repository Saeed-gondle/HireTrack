
import Image from "next/image"
import { HiEye } from "react-icons/hi2";
import Menus, { Menu, Toggle, List, Button } from "./Menu";
import { auth } from "@/lib/auth";

export default async function ProfilePicture() {
    const session = await auth();
    return (
        <Menus>

            <div className="flex items-center gap-2">
                <Menu>
                    <Toggle id={"profile"}>
                        <div className="flex items-center gap-2 cursor-pointer">
                            <Image
                                src={session?.user?.image || "/default-user.jpg"}
                                alt="User Avatar"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            {session?.user?.name}
                        </div>
                    </Toggle>
                    <List id={"profile"}>
                        <Button icon={<HiEye />}>
                            See Profile
                        </Button>
                        <Button icon={<HiEye />}>
                            Settings
                        </Button>
                        <Button icon={<HiEye />}>
                            Logout
                        </Button>
                    </List>
                </Menu>

            </div>
        </Menus>

    )
}