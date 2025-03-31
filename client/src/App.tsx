import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminDevPage from "@/pages/admin-dev-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const SearchFormPage = lazy(() => import("@/pages/search-form-page"));
const SearchHistoryPage = lazy(() => import("@/pages/search-history-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const OrganizationPage = lazy(() => import("@/pages/organization-page"));
const CustomersPage = lazy(() => import("@/pages/customers-page"));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Update ProtectedLayout to use the AppLayout
const ProtectedLayout = ({ Component }: { Component: React.ComponentType }) => {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </AppLayout>
  );
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute 
        path="/" 
        component={() => <ProtectedLayout Component={DashboardPage} />} 
      />
      <ProtectedRoute 
        path="/search/new" 
        component={() => <ProtectedLayout Component={SearchFormPage} />} 
      />
      <ProtectedRoute 
        path="/search/edit/:id" 
        component={() => <ProtectedLayout Component={SearchFormPage} />} 
      />
      <ProtectedRoute 
        path="/history" 
        component={() => <ProtectedLayout Component={SearchHistoryPage} />} 
      />
      <ProtectedRoute 
        path="/profile" 
        component={() => <ProtectedLayout Component={ProfilePage} />} 
      />
      <ProtectedRoute 
        path="/organization" 
        component={() => <ProtectedLayout Component={OrganizationPage} />} 
      />
      <ProtectedRoute 
        path="/customers" 
        component={() => <ProtectedLayout Component={CustomersPage} />} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin-dev" component={AdminDevPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
