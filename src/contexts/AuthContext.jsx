import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create a profile row for the given user
  async function fetchOrCreateProfile(authUser) {
    if (!authUser) { setProfile(null); return; }

    // Try to fetch existing profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    if (data) {
      setProfile(data);
      return;
    }

    // Profile doesn't exist yet → create a blank one (first login)
    if (error?.code === "PGRST116") {
      const meta = authUser.user_metadata || {};
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id:    authUser.id,
          name:       meta.full_name || meta.name || "",
          email:      authUser.email || "",
          avatar_url: meta.avatar_url || meta.picture || "",
          skills:     [],
        })
        .select()
        .single();

      if (!insertError) setProfile(newProfile);
      else console.error("Error creating profile:", insertError.message);
    } else if (error) {
      console.error("Error fetching profile:", error.message);
    }
  }

  useEffect(() => {
    // Get the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      fetchOrCreateProfile(authUser).finally(() => setLoading(false));
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authUser = session?.user ?? null;
        setUser(authUser);
        await fetchOrCreateProfile(authUser);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Trigger Google OAuth popup/redirect
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) console.error("Google sign-in error:", error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  // Expose a refresh function so Settings can update the profile in context
  async function refreshProfile() {
    if (user) await fetchOrCreateProfile(user);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
