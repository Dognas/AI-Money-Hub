import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "@/pages/HomePage";
import CalculatorPage from "@/pages/CalculatorPage";
import MarketDataPage from "@/pages/MarketDataPage";
import DashboardPage from "@/pages/DashboardPage";
import CoachPage from "@/pages/CoachPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/calculator/:id" component={CalculatorPage} />
      <Route path="/market" component={MarketDataPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/coach" component={CoachPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
