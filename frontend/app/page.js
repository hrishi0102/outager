"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

export default function Home() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">Outager</div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Status Pages Made Simple
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor your services, manage incidents, and keep your users
            informed with our clean and simple status page solution.
          </p>
          <div className="space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="px-8">
                    Start Free
                  </Button>
                </Link>
                <Link href="/demo" className="inline-block">
                  <Button variant="outline" size="lg" className="px-8">
                    View Demo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Outager. Built for monitoring excellence.</p>
        </div>
      </footer>
    </div>
  );
}
