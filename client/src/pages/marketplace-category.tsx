import { useParams, useLocation } from "wouter";
import { NavigationBar } from "@/components/NavigationBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { MarketplaceListing } from "@shared/schema";
import { categories } from "./marketplace";

export default function MarketplaceCategoryPage() {
  const { category } = useParams();
  const [, navigate] = useLocation();

  const { data: listings = [], isLoading } = useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace/listings', category],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings?category=${category}`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    }
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate("/marketplace")}>Return to Marketplace</Button>
        </div>
      </div>
    );
  }

  const categoryData = categories.find(cat => cat.id === category);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <Button 
          variant="ghost" 
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => navigate("/marketplace")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>

        {/* Category Header */}
        <Card className={`overflow-hidden mb-8`}>
          <div className={`bg-gradient-to-r ${categoryData?.gradient} p-6 text-white`}>
            <h1 className="text-2xl font-bold mb-2 capitalize">{categoryData?.title || category}</h1>
            <p className="text-white/90">{categoryData?.description || "Find Christian businesses and services in this category"}</p>
          </div>
        </Card>

        {/* Organizations List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium mb-2">No Listings Found</p>
              <p className="text-muted-foreground">
                Be the first to list your organization in this category!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {listings.map((listing) => (
                <Card key={listing.id} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{listing.name}</h3>
                      <p className="text-sm text-muted-foreground">{listing.title}</p>
                    </div>

                    <p className="text-sm text-gray-600">{listing.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {listing.email && (
                        <a 
                          href={`mailto:${listing.email}`}
                          className="hover:text-primary transition-colors"
                        >
                          {listing.email}
                        </a>
                      )}
                      {listing.phone && (
                        <a 
                          href={`tel:${listing.phone}`}
                          className="hover:text-primary transition-colors"
                        >
                          {listing.phone}
                        </a>
                      )}
                      {listing.location && (
                        <span>{listing.location}, {listing.country}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}