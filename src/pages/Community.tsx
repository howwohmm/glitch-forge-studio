
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, Clock, Heart, ArrowUpDown } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CommunityPreset {
  id: string;
  name: string;
  creator: string;
  category: string;
  upvotes: number;
  preview: string;
  tags: string[];
  createdAt: string;
  isUpvoted?: boolean;
}

const mockPresets: CommunityPreset[] = [
  {
    id: '1',
    name: 'Retro Dither',
    creator: 'pixelmaster',
    category: 'Error Diffusion',
    upvotes: 245,
    preview: '',
    tags: ['retro', 'vintage', 'dither'],
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Cyberpunk Glitch',
    creator: 'synthwave_dev',
    category: 'Glitch',
    upvotes: 189,
    preview: '',
    tags: ['cyberpunk', 'neon', 'glitch'],
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    name: 'Newspaper Halftone',
    creator: 'printdesigner',
    category: 'Modulation',
    upvotes: 156,
    preview: '',
    tags: ['halftone', 'print', 'newspaper'],
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    name: 'Matrix Rain',
    creator: 'code_ninja',
    category: 'Pattern',
    upvotes: 203,
    preview: '',
    tags: ['matrix', 'code', 'digital'],
    createdAt: '2024-01-12',
  },
  {
    id: '5',
    name: 'Broken LCD',
    creator: 'error_artist',
    category: 'Special Effects',
    upvotes: 178,
    preview: '',
    tags: ['lcd', 'broken', 'distortion'],
    createdAt: '2024-01-11',
  },
  {
    id: '6',
    name: 'Vintage TV',
    creator: 'nostalgia_fx',
    category: 'Bitmap',
    upvotes: 134,
    preview: '',
    tags: ['vintage', 'tv', 'scanlines'],
    createdAt: '2024-01-10',
  },
];

export default function Community() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [presets, setPresets] = useState(mockPresets);

  const handleUpvote = (presetId: string) => {
    setPresets(prev => prev.map(preset => {
      if (preset.id === presetId) {
        return {
          ...preset,
          upvotes: preset.isUpvoted ? preset.upvotes - 1 : preset.upvotes + 1,
          isUpvoted: !preset.isUpvoted
        };
      }
      return preset;
    }));
  };

  const filteredPresets = presets
    .filter(preset => {
      const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           preset.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           preset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || preset.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          return b.upvotes - a.upvotes;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  const categories = ['Error Diffusion', 'Bitmap', 'Glitch', 'Pattern', 'Modulation', 'Special Effects'];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 p-4">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Community <span className="text-gradient">Presets</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover and share effect presets created by the creative community
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass rounded-xl p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search presets, creators, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trending
                    </div>
                  </SelectItem>
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Newest
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Oldest
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresets.map((preset, index) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glass-hover group cursor-pointer">
                  <CardContent className="p-0">
                    {/* Preview Image */}
                    <div className="aspect-square bg-gradient-to-br from-ohmedit-red/20 to-muted/20 rounded-t-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button variant="secondary" size="sm">
                          Try Preset
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{preset.name}</h3>
                          <p className="text-sm text-muted-foreground">by {preset.creator}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(preset.id);
                          }}
                          className={`${preset.isUpvoted ? 'text-ohmedit-red' : 'text-muted-foreground'} hover:text-ohmedit-red`}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${preset.isUpvoted ? 'fill-current' : ''}`} />
                          {preset.upvotes}
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{preset.category}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {preset.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-muted px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPresets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <h3 className="text-xl font-semibold mb-2">No presets found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
