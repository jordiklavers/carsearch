import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import SearchFormPage from "@/pages/search-form-page";
import SearchHistoryPage from "@/pages/search-history-page";
import AdminDevPage from "@/pages/admin-dev-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/search/new" component={SearchFormPage} />
      <ProtectedRoute path="/search/edit/:id" component={SearchFormPage} />
      <ProtectedRoute path="/history" component={SearchHistoryPage} />
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
