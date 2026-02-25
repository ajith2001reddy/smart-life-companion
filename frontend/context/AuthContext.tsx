"use client";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

interface User {
    _id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const [token, setToken] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("token");
        }
        return null;
    });

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔥 Validate token & load user
    useEffect(() => {
        const storedToken = localStorage.getItem("token");

        if (!storedToken) {
            setLoading(false);
            return;
        }

        setToken(storedToken);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${storedToken}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                setUser(data);
            })
            .catch(() => {
                localStorage.removeItem("token");
                setToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = (newToken: string) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        router.push("/dashboard"); // ✅ redirect properly
    };

    const logout = async () => {
        try {
            await signOut(firebaseAuth); // 🔥 This is the missing piece
        } catch (e) {
            console.error("Firebase signout error:", e);
        }

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return context;
}