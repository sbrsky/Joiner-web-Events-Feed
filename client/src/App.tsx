import { useEffect } from "react";
import { captureUTMs } from "./lib/utm";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import EventsWebview from "@/pages/events-webview";
import EventPage from "@/pages/event-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import CreateEventPage from "@/pages/create-event";
import ClientPage from "@/pages/client-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={EventsWebview} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/event/:id" component={EventPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/create-event" component={CreateEventPage} />
      <Route path="/client/:id" component={ClientPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    captureUTMs();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
