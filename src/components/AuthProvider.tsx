
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Note: These should be environment variables in production
const supabaseUrl = "https://your-project.supabase.co";
const supabaseAnonKey = "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface User {
  id: string;
  email?: string;
  codeword?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signInWithCodeword: (codeword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
  };

  const signInWithCodeword = async (codeword: string) => {
    // Implementation would require custom auth logic
    console.log("Codeword login:", codeword);
    // This would need to be implemented with custom auth
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    loading,
    signIn,
    signInWithCodeword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
