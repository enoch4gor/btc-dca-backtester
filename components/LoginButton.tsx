import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export const LoginButton: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (user) {
        return (
            <div className="flex items-center gap-3 bg-tech-900/50 border border-tech-cyan/30 rounded-full px-4 py-1.5 backdrop-blur-sm">
                {user.user_metadata.avatar_url ? (
                    <img
                        src={user.user_metadata.avatar_url}
                        alt="User"
                        className="w-6 h-6 rounded-full border border-tech-gold"
                    />
                ) : (
                    <UserIcon className="w-5 h-5 text-tech-cyan" />
                )}
                <span className="text-xs text-gray-300 font-mono hidden md:inline">
                    {user.email}
                </span>
                <button
                    onClick={handleLogout}
                    className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            className="flex items-center gap-2 bg-tech-cyan/10 hover:bg-tech-cyan/20 border border-tech-cyan/50 text-tech-cyan px-4 py-2 rounded-lg text-sm font-mono transition-all duration-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        >
            <LogIn className="w-4 h-4" />
            <span>LOGIN /w GOOGLE</span>
        </button>
    );
};
