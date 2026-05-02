"use client";
import { RESULT_STORAGE_KEY } from "@/lib/prediction";
import StaggeredMenu from "./StaggeredMenu";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "Profile", ariaLabel: "View your profile", link: "/dashboard" },
  { label: "How it works", ariaLabel: "How it works", link: "/howitworks" },
  { label: "Privacy", ariaLabel: "Read privacy overview", link: "/privacy" },
];

export default function NavBar() {
  const [signingIn, setSigningIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setUserEmail(session?.user?.email ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (raw) localStorage.setItem("pending_result", raw);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  const socialItems = [
    {
      label: userEmail ?? (signingIn ? "Redirecting…" : "Google"),
      onClick: userEmail ? undefined : handleSignIn,
      link: userEmail ? "/dashboard" : "#",
    },
  ];

  return (
    <div className="flex items-center gap-2 text-2xl #1a1a1a">
      <StaggeredMenu
        position="right"
        items={menuItems}
        displaySocials={true}
        socialItems={socialItems}
        displayItemNumbering={true}
        menuButtonColor="#ffffff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen={true}
        colors={["#B497CF", "#5227FF"]}
        logoUrl="/favicon.ico"
        accentColor="#5227FF"
        isFixed
        link=""
        onMenuOpen={() => console.log("Menu opened")}
        onMenuClose={() => console.log("Menu closed")}
      />
    </div>
  );
}
