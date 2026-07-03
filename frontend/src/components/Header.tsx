import ProfilePicture from "./ProfilePicture";
import SearchBar from "./SearchBar";
import AccountActions from "./AccountActions";

function Header() {
    return (
        <header >
            <div className="flex items-center justify-between">
                <SearchBar />
                <div className="flex items-center gap-2">
                    <AccountActions />
                    <ProfilePicture />
                </div>
            </div>
        </header>
    )
}

export default Header
