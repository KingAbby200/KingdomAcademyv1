import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Link } from 'wouter';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  id: string;
  name: string;
  username: string;
  title: string;
  avatar: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', searchQuery],
    queryFn: async () => {
      const usersRef = collection(db, 'users');
      let q = query(usersRef);

      if (searchQuery) {
        q = query(
          usersRef,
          where('searchableText', '>=', searchQuery.toLowerCase()),
          where('searchableText', '<=', searchQuery.toLowerCase() + '\uf8ff')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    }
  });

  const filteredUsers = users.filter((user: User) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center gap-3 p-4">
          <Link href="/home">
            <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
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
      </div>

      {/* Results */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium mb-2">No users found</p>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search terms"
                  : "Be the first to join our community!"}
              </p>
            </div>
          ) : (
            filteredUsers.map((user: User) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <Link href={`/profile/${user.username}`}>
                  <div className="flex items-center gap-4 cursor-pointer">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                      <img src={user.avatar} alt={user.name} className="object-cover" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base text-foreground">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.title}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}