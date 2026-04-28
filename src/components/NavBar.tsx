"use client";
import StaggeredMenu from "./StaggeredMenu";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "Profile", ariaLabel: "View your profile", link: "/profile" },
  {
    label: "History",
    ariaLabel: "View your screening history",
    link: "/history",
  },
  {
    label: "How it works",
    ariaLabel: "How it works",
    link: "/howitworks",
  },

  { label: "Privacy", ariaLabel: "Read privacy overview", link: "/privacy" },
];

export default function NavBar() {
  return (
    <div className="flex items-center gap-2 text-2xl text-black">
      <StaggeredMenu
        position="right"
        items={menuItems}
        displaySocials={false}
        displayItemNumbering={true}
        menuButtonColor="#1a1d23"
        openMenuButtonColor="#1a1d23"
        changeMenuColorOnOpen={true}
        colors={["#1a1d23", "#1a1d23"]}
        logoUrl="/favicon.ico"
        accentColor="#5227FF"
        isFixed
        onMenuOpen={() => console.log("Menu opened")}
        onMenuClose={() => console.log("Menu closed")}
      />
    </div>
  );
}
