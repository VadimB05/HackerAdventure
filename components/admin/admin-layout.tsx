'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Target, 
  DoorOpen, 
  Puzzle, 
  Package, 
  Settings,
  BarChart3,
  Menu,
  X,
  Gamepad2
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const navigationItems = [
  { 
    name: 'Dashboard', 
    icon: BarChart3, 
    href: '/admin', 
    description: 'Übersicht über das System' 
  },
  { 
    name: 'Benutzer', 
    icon: Users, 
    href: '/admin/users', 
    description: 'Benutzer verwalten und Admin-Rechte zuweisen' 
  },
  { 
    name: 'Städte', 
    icon: Building2, 
    href: '/admin/cities', 
    description: 'Städte anlegen und verwalten' 
  },
  { 
    name: 'Missionen', 
    icon: Target, 
    href: '/admin/missions', 
    description: 'Missionen erstellen und zuordnen' 
  },
  { 
    name: 'Räume', 
    icon: DoorOpen, 
    href: '/admin/rooms', 
    description: 'Räume anlegen und Objekte positionieren' 
  },
  { 
    name: 'Rätsel', 
    icon: Puzzle, 
    href: '/admin/puzzles', 
    description: 'Rätsel erstellen und konfigurieren' 
  },
  { 
    name: 'Objekte', 
    icon: Package, 
    href: '/admin/objects', 
    description: 'Items und Raum-Objekte verwalten' 
  },
  { 
    name: 'Einstellungen', 
    icon: Settings, 
    href: '/admin/settings', 
    description: 'System-Einstellungen' 
  }
];

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex admin-panel">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-gray-800 shadow-lg h-full flex-shrink-0
        ${sidebarOpen ? 'block' : 'hidden'} lg:block
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h1 className="text-xl font-bold text-white">Admin-Panel</h1>
              <p className="text-sm text-gray-400">INTRUSION</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Button
                  key={item.name}
                  variant={active ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    active 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-700">
            <Button
              variant="outline"
              className="w-full text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
              onClick={() => router.push('/game')}
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Zum Spiel
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top Header */}
        <header className="bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="flex items-center justify-between px-5 py-5 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {description && (
                  <p className="text-gray-400">{description}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 bg-gray-900 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 