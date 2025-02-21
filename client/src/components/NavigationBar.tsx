import { Home, BookOpen, Users, User, MessageCircle, ShoppingBag, Building2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "wouter";

// For now, hardcode current user as Andre Butler
const currentUser = {
  username: "andre_butler",
  name: "Andre Butler",
  title: "Kingdom Business Coach & Mentor",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AndreButler"
};

interface NavigationBarProps {
  onCreatePost: () => void;
}

export function NavigationBar({ onCreatePost }: NavigationBarProps) {
  const [location, navigate] = useLocation();

  const navItems = [
    { id: "home", icon: Home, label: "Home", href: "/home" },
    { id: "resources", icon: BookOpen, label: "Resources", href: "/resources" },
    { id: "marketplace", icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
    { id: "create", icon: Plus, label: "Create", href: "", special: true, type: "create" },
    { id: "messenger", icon: MessageCircle, label: "Messenger", href: "/messenger" },
    { id: "rooms", icon: Building2, label: "Rooms", href: "/rooms" },
    { id: "profile", icon: User, label: "Profile", href: `/profile/${currentUser.username}` },
  ];

  const handleCreateClick = () => {
    if (location !== '/home') {
      navigate('/home?create=true');
    } else {
      onCreatePost();
    }
  };

  const isActive = (href: string) => {
    if (href === "") return false;
    return location === href;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-background/95 backdrop-blur-lg border-t shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.special) {
                const isCreateButton = item.type === "create";

                return (
                  <motion.button
                    key={item.id}
                    onClick={isCreateButton ? handleCreateClick : undefined}
                    className={`relative -top-6 bg-gradient-to-r from-[#A76F6F] to-[#2D4356] p-3.5 rounded-xl shadow-xl`}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ y: 0 }}
                    animate={{ 
                      y: [0, -4, 0],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                    <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-primary">
                      {item.label}
                    </span>
                  </motion.button>
                );
              }

              const active = isActive(item.href);

              return (
                <Link key={item.id} href={item.href}>
                  <motion.button
                    className="flex flex-col items-center gap-1 py-1.5 relative group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className={`
                        absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full
                        ${active ? 'bg-primary scale-100' : 'scale-0'}
                      `}
                      initial={false}
                      animate={{
                        scale: active ? 1 : 0,
                        opacity: active ? 1 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    />
                    <div className={`
                      relative p-1.5 rounded-lg transition-colors duration-200
                      ${active 
                        ? 'text-primary' 
                        : 'text-muted-foreground hover:text-primary'
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                      {active && (
                        <motion.div
                          className="absolute inset-0 bg-primary/10 rounded-lg"
                          layoutId="activeTab"
                          transition={{ type: "spring", duration: 0.5 }}
                        />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium transition-colors duration-200
                      ${active 
                        ? 'text-primary' 
                        : 'text-muted-foreground group-hover:text-primary'
                      }
                    `}>
                      {item.label}
                    </span>
                  </motion.button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}