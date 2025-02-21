import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Avatar } from '@/components/ui/avatar';
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/users${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: isOpen // Only fetch when modal is open
  });

  return (
    <>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 bg-background z-50 overflow-hidden"
        >
          <div className="h-full flex flex-col">
            {/* Search Header */}
            <div className="border-b border-border/40 p-4 flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-muted/30 border-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base"
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-4">
              <div className="max-w-2xl mx-auto py-4 space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-lg font-medium mb-2">No users found</p>
                    <p className="text-muted-foreground">
                      Try searching for a different term
                    </p>
                  </div>
                ) : (
                  users.map((user) => (
                    <Link key={user.id} href={`/profile/${user.username}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer flex items-center gap-4"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                          <img src={user.avatar} alt={user.name} className="object-cover" />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="font-medium text-base text-foreground truncate">
                              {user.name}
                            </p>
                            <span className="text-sm text-muted-foreground truncate">
                              @{user.username}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.role}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}