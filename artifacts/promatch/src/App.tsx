import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";

import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Portfolio from "@/pages/portfolio";
import PortfolioPublic from "@/pages/portfolio-public";
import Topics from "@/pages/topics";
import TopicDetail from "@/pages/topic-detail";
import TopicsRecommended from "@/pages/topics-recommended";
import TopicsAI from "@/pages/topics-ai";
import Trends from "@/pages/trends";
import Marketplace from "@/pages/marketplace";
import MarketplaceDetail from "@/pages/marketplace-detail";
import MarketplaceNew from "@/pages/marketplace-new";
import Teams from "@/pages/teams";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import InstructorDashboard from "@/pages/instructor-dashboard";
import Knowledge from "@/pages/knowledge";
import KnowledgeDetail from "@/pages/knowledge-detail";
import Notifications from "@/pages/notifications";
import Analytics from "@/pages/analytics";
import Admin from "@/pages/admin";
import AdminUsers from "@/pages/admin-users";
import AdminModeration from "@/pages/admin-moderation";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/portfolio/public/:userId" component={PortfolioPublic} />
        <Route path="/topics" component={Topics} />
        <Route path="/topics/recommended" component={TopicsRecommended} />
        <Route path="/topics/ai" component={TopicsAI} />
        <Route path="/topics/:topicId" component={TopicDetail} />
        <Route path="/trends" component={Trends} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/marketplace/new" component={MarketplaceNew} />
        <Route path="/marketplace/:callId" component={MarketplaceDetail} />
        <Route path="/teams" component={Teams} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:projectId" component={ProjectDetail} />
        <Route path="/instructor" component={InstructorDashboard} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/knowledge/:archiveId" component={KnowledgeDetail} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/moderation" component={AdminModeration} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
