import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";

// Lazy load components with proper error boundaries
const Home = React.lazy(() => import("@/pages/home"));
const Profile = React.lazy(() => import("@/pages/profile"));
const EditProfile = React.lazy(() => import("@/pages/edit-profile"));
const Messages = React.lazy(() => import("@/pages/messages"));
const RoomsPage = React.lazy(() => import("@/pages/rooms"));
const CategoryPage = React.lazy(() => import("@/pages/category"));
const RoomPage = React.lazy(() => import("@/pages/room"));
const CreateRoomPage = React.lazy(() => import("@/pages/create-room"));
const Resources = React.lazy(() => import("@/pages/resources"));
const ResourceCategory = React.lazy(() => import("@/pages/resource-category"));
const Search = React.lazy(() => import("@/pages/search"));
const Devotional = React.lazy(() => import("@/pages/devotional"));
const DevotionalDetail = React.lazy(() => import("@/pages/devotional-detail"));
const Bible = React.lazy(() => import("@/pages/bible"));
const MarketplacePage = React.lazy(() => import("@/pages/marketplace"));
const MarketplaceCategoryPage = React.lazy(() => import("@/pages/marketplace-category"));
const SubmitListingPage = React.lazy(() => import("@/pages/submit-listing"));
const MessengerPage = React.lazy(() => import("@/pages/messenger"));
const Admin = React.lazy(() => import("@/pages/admin"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className="text-primary hover:underline"
              onClick={() => window.location.reload()}
            >
              Try reloading the page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const [location] = useLocation();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (location.startsWith('/profile')) {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    }
  }, [location]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/" component={Welcome} />
          <Route path="/home" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/profile" component={Profile} />
          <Route path="/edit-profile" component={EditProfile} />
          <Route path="/messages/:username" component={Messages} />
          <Route path="/rooms" component={RoomsPage} />
          <Route path="/category/:id" component={CategoryPage} />
          <Route path="/room/:roomId" component={RoomPage} />
          <Route path="/create-room" component={CreateRoomPage} />
          <Route path="/resources" component={Resources} />
          <Route path="/resources/:category" component={ResourceCategory} />
          <Route path="/devotional" component={Devotional} />
          <Route path="/devotional/:topicId/:devotionalId" component={DevotionalDetail} />
          <Route path="/bible" component={Bible} />
          <Route path="/marketplace" component={MarketplacePage} />
          <Route path="/marketplace/:category" component={MarketplaceCategoryPage} />
          <Route path="/submit-listing" component={SubmitListingPage} />
          <Route path="/messenger" component={MessengerPage} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </React.Suspense>
    </ErrorBoundary>
  );
}

function App() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;