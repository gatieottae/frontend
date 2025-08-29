
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import GroupDetail from "./pages/GroupDetail";
import Profile from "./pages/Profile";
import TravelGuide from "./pages/TravelGuide";
import GuideDetail from "./pages/GuideDetail";
import GuideContact from "./pages/GuideContact";
import AuthorGuides from "./pages/AuthorGuides";
import Invitations from "./pages/Invitations";
import InviteLanding from "./pages/InviteLanding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/group/:id" element={<GroupDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/travel-guide" element={<TravelGuide />} />
            <Route path="/guide/:id" element={<GuideDetail />} />
            <Route path="/guide-contact" element={<GuideContact />} />
            <Route path="/author/:id/guides" element={<AuthorGuides />} />
            <Route path="/invitations" element={<Invitations />} />
            <Route path="/invite/:code" element={<InviteLanding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
