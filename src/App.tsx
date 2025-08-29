
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Index from "@/pages/Index";
import TravelGuide from "@/pages/TravelGuide";
import GuideDetail from "@/pages/GuideDetail";
import GuideContact from "@/pages/GuideContact";
import AuthorGuides from "@/pages/AuthorGuides";
import GroupDetail from "@/pages/GroupDetail";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/travel-guide" element={<TravelGuide />} />
              <Route path="/guide/:guideId" element={<GuideDetail />} />
              <Route path="/guide/:guideId/contact" element={<GuideContact />} />
              <Route path="/author/:authorId/guides" element={<AuthorGuides />} />
              <Route path="/group/:groupId" element={<GroupDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
