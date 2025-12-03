import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import NovaSolicitacaoPage from "./pages/NovasolicitacaoPage";
import MinhasSolicitacoesPage from "./pages/MinhasSolicitacoesPage";
import SolicitacaoDetalhesPage from "./pages/SolicitacaoDetalhesPage";
import GerenciarSolicitacoesPage from "./pages/GerenciarSolicitacoesPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import PerfilPage from "./pages/PerfilPage";
import GerenciarUsuariosPage from "./pages/GerenciarUsuariosPage";
import AjudaPage from "./pages/AjudaPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nova-solicitacao" element={<NovaSolicitacaoPage />} />
            <Route path="/minhas-solicitacoes" element={<MinhasSolicitacoesPage />} />
            <Route path="/solicitacao/:id" element={<SolicitacaoDetalhesPage />} />
            <Route path="/gerenciar" element={<GerenciarSolicitacoesPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/gerenciar-usuarios" element={<GerenciarUsuariosPage />} />
            <Route path="/ajuda" element={<AjudaPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
