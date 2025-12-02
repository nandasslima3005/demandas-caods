import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Settings,
  HelpCircle,
  User,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
}

function NavItem({ to, icon: Icon, label, collapsed }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
        isActive && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg gradient-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-sidebar-foreground font-display truncate">
                CAO Saúde
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">
                Sistema de Demandas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Menu
            </p>
          )}
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
          <NavItem to="/nova-solicitacao" icon={FilePlus} label="Nova Solicitação" collapsed={collapsed} />
          <NavItem to="/minhas-solicitacoes" icon={FileText} label="Minhas Solicitações" collapsed={collapsed} />
        </div>

        <div className="mb-4">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Gestão
            </p>
          )}
          <NavItem to="/gerenciar" icon={Shield} label="Gerenciar Solicitações" collapsed={collapsed} />
          <NavItem to="/relatorios" icon={BarChart3} label="Relatórios" collapsed={collapsed} />
        </div>

        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Configurações
            </p>
          )}
          <NavItem to="/perfil" icon={User} label="Perfil" collapsed={collapsed} />
          <NavItem to="/ajuda" icon={HelpCircle} label="FAQ / Ajuda" collapsed={collapsed} />
          <NavItem to="/configuracoes" icon={Settings} label="Configurações" collapsed={collapsed} />
        </div>
      </nav>

      {/* Collapse Button */}
      <div className="absolute bottom-4 right-0 translate-x-1/2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-card border-border shadow-md"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
