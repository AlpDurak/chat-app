import { User } from "@supabase/auth-helpers-nextjs";
import { AuthError, UserResponse } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import supabase from "./supabase";

export default function useUser(): { user: User | null, error: AuthError | null, refetch: VoidFunction } {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<AuthError | null>(null);

    let reloads = 0;

    const refetch = () => reloads++;
    
    useEffect(() => {
        supabase.auth.getUser().then(({ data, error }: UserResponse) => {
            setUser(data.user);
            setError(error);
        })
    }, [reloads])

    return {
        user,
        error,
        refetch
    }
}