import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NavigationBar } from '@/components/NavigationBar';
import { Building2, ShoppingBag, Film, GraduationCap, Church, Landmark, Globe, BadgeCheck, Plus, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

export const categories = [
  {
    id: 'business',
    title: 'Business',
    icon: Building2,
    description: 'Connect with Kingdom-minded businesses and entrepreneurs.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    icon: Film,
    description: 'Discover faith-based entertainment and media.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'education',
    title: 'Education',
    icon: GraduationCap,
    description: 'Find educational resources and institutions.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'ministry',
    title: 'Ministry',
    icon: Church,
    description: 'Connect with ministries and spiritual organizations.',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    id: 'government',
    title: 'Government',
    icon: Landmark,
    description: 'Government and public sector organizations.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    id: 'other',
    title: 'Other',
    icon: Globe,
    description: 'Other Kingdom-minded organizations and services.',
    gradient: 'from-cyan-500 to-teal-600',
  },
] as const;

// Enhanced featured organization
const featuredOrg = {
  name: "Kingdom Business Solutions",
  title: "Business Consulting & Ministry Support",
  description: "Leading the way in integrating faith and business practices, Kingdom Business Solutions helps organizations align their operations with biblical principles while maximizing impact and growth.",
  category: "business",
  verified: true,
  contact: {
    email: "contact@kingdombusiness.org",
    phone: "+1 (555) 123-4567",
    location: "Atlanta, GA",
  },
  tags: ["Consulting", "Ministry", "Business Strategy"]
};

export default function MarketplacePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Redesigned Header Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-[#2D4356] to-[#A76F6F] bg-clip-text text-transparent">
                  Kingdom Directory
                </span>
              </h1>
              <p className="text-muted-foreground">
                Connect with Kingdom-minded businesses and organizations
              </p>
            </div>
            <Button
              onClick={() => navigate("/submit-listing")}
              size="lg"
              className="bg-[#2D4356] hover:bg-[#2D4356]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Listing
            </Button>
          </div>
        </div>

        {/* Featured Organization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          {/* Featured Badge - Moved above card */}
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-gradient-to-r from-[#2D4356] to-[#A76F6F] px-3 py-1 rounded-full flex items-center gap-2 text-white">
              <span className="text-xs font-medium">Featured</span>
              <BadgeCheck className="h-4 w-4 text-amber-400" />
            </div>
          </div>

          <Card className="overflow-hidden bg-gradient-to-br from-[#2D4356] to-[#A76F6F] text-white">
            <div className="p-6">
              {/* Organization Name and Status */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold whitespace-nowrap">{featuredOrg.name}</h3>
              </div>

              {/* Title */}
              <p className="text-sm text-white/90 mb-4 whitespace-nowrap">{featuredOrg.title}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {featuredOrg.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 bg-black/10 text-[11px] font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="bg-black/10 rounded-lg p-3 mb-4">
                <p className="text-sm leading-relaxed text-white/90">
                  {featuredOrg.description}
                </p>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <a 
                  href={`mailto:${featuredOrg.contact.email}`}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-white/70" />
                  <span className="text-xs">{featuredOrg.contact.email}</span>
                </a>
                <a 
                  href={`tel:${featuredOrg.contact.phone}`}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-white/70" />
                  <span className="text-xs">{featuredOrg.contact.phone}</span>
                </a>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                  <MapPin className="h-3.5 w-3.5 text-white/70" />
                  <span className="text-xs">{featuredOrg.contact.location}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
                onClick={() => navigate(`/marketplace/${category.id}`)}
                className="cursor-pointer"
              >
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`bg-gradient-to-r ${category.gradient} h-full p-4 text-white`}>
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-h-[80px] flex flex-col">
                        <h3 className="font-semibold mb-1">{category.title}</h3>
                        <p className="text-xs text-white/90">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}