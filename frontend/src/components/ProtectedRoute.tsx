"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Check role if required
    if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
      router.replace("/dashboard");
      return;
    }

    setCanAccess(true);
  }, [isAuthenticated, isLoading, requiredRoles, hasRole, router]);

  if (isLoading || !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-secondary mb-4">Loading...</p>
          <div className="w-8 h-8 border-4 border-border border-t-primary-accent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
