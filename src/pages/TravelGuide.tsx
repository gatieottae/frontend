import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Heart,
  Search,
  Camera,
  Utensils,
  Bed,
  Car
} from "lucide-react";

// 임시 가이드 데이터
const travelGuides = [
  {
    id: "1",
    title: "제주도 3박 4일 완벽 가이드",
    location: "제주도",
    category: "자연",
    rating: 4.8,
    reviewCount: 245,
    image: "/placeholder.svg",
    tags: ["힐링", "자연", "드라이브"],
    description: "제주도의 숨겨진 명소부터 유명한 관광지까지, 3박 4일 동안 즐길 수 있는 완벽한 코스를 소개합니다.",
    duration: "3박 4일",
    budget: "30-40만원"
  },
  {
    id: "2",
    title: "부산 맛집 투어 가이드",
    location: "부산",
    category: "맛집",
    rating: 4.9,
    reviewCount: 182,
    image: "/placeholder.svg",
    tags: ["맛집", "해산물", "야경"],
    description: "부산의 대표 맛집부터 숨은 맛집까지, 미식가들을 위한 특별한 여행 코스입니다.",
    duration: "2박 3일",
    budget: "20-30만원"
  },
  {
    id: "3",
    title: "경주 역사 문화 탐방",
    location: "경주",
    category: "문화",
    rating: 4.7,
    reviewCount: 156,
    image: "/placeholder.svg",
    tags: ["역사", "문화", "전통"],
    description: "천년 고도 경주의 역사와 문화를 체험할 수 있는 특별한 여행 코스를 안내합니다.",
    duration: "2박 3일",
    budget: "25-35만원"
  }
];

const categories = [
  { id: "all", name: "전체", icon: MapPin },
  { id: "자연", name: "자연", icon: Camera },
  { id: "맛집", name: "맛집", icon: Utensils },
  { id: "문화", name: "문화", icon: Bed },
  { id: "액티비티", name: "액티비티", icon: Car }
];

const TravelGuide = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredGuides = travelGuides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (guideId: string) => {
    setFavorites(prev => 
      prev.includes(guideId) 
        ? prev.filter(id => id !== guideId)
        : [...prev, guideId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">여행 가이드</h1>
                <p className="text-muted-foreground">전국 최고의 여행 코스를 만나보세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search Section */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="가이드 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              {filteredGuides.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">해당하는 여행 가이드가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGuides.map((guide, index) => (
                    <Card key={guide.id} className="card-hover overflow-hidden" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="relative">
                        <img 
                          src={guide.image} 
                          alt={guide.title}
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => toggleFavorite(guide.id)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              favorites.includes(guide.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-600'
                            }`} 
                          />
                        </Button>
                        <Badge className="absolute bottom-2 left-2 bg-primary text-white">
                          {guide.category}
                        </Badge>
                      </div>
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{guide.title}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{guide.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{guide.rating}</span>
                            <span>({guide.reviewCount})</span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{guide.description}</p>
                        
                        <div className="flex flex-wrap gap-1">
                          {guide.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{guide.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{guide.budget}</span>
                          </div>
                        </div>
                        
                        <Link to={`/guide/${guide.id}`}>
                          <Button className="w-full">
                            가이드 보기
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TravelGuide;
