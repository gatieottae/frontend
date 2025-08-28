
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, TrendingUp, Search, Plus } from "lucide-react";
import TravelGroupCard from "@/components/TravelGroupCard";
import CreateGroupDialog from "@/components/CreateGroupDialog";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 임시 데이터
  const travelGroups = [
    {
      id: "1",
      title: "제주도 힐링 여행 🌴",
      destination: "제주도",
      dateRange: "3월 15일 - 18일",
      currentMembers: 4,
      maxMembers: 6,
      status: "recruiting" as const,
      tags: ["힐링", "자연", "카페투어"],
      description: "제주도에서 힐링하면서 예쁜 카페들도 투어해요!"
    },
    {
      id: "2", 
      title: "부산 맛집 탐방 🦐",
      destination: "부산",
      dateRange: "4월 20일 - 22일",
      currentMembers: 3,
      maxMembers: 5,
      status: "recruiting" as const,
      tags: ["맛집", "해변", "도시"],
      description: "부산 유명 맛집들과 해운대 바다를 만나러 가요"
    },
    {
      id: "3",
      title: "경주 역사 탐방 🏛️",
      destination: "경주",
      dateRange: "5월 10일 - 12일", 
      currentMembers: 5,
      maxMembers: 5,
      status: "confirmed" as const,
      tags: ["역사", "문화", "체험"],
      description: "천년 고도 경주에서 우리 역사를 배워요"
    }
  ];

  const categories = [
    { id: "all", label: "전체", count: travelGroups.length },
    { id: "recruiting", label: "모집중", count: travelGroups.filter(g => g.status === "recruiting").length },
    { id: "confirmed", label: "확정됨", count: travelGroups.filter(g => g.status === "confirmed").length }
  ];

  const filteredGroups = travelGroups.filter(group => {
    const matchesSearch = group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || group.status === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 hero-text">
            <span className="special-text">친구들과 함께하는 완벽한 여행</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            여행 계획부터 일정 관리, 투표, 채팅, 결제까지 모든 것을 한 곳에서 관리하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CreateGroupDialog>
              <Button size="lg" className="px-8 py-3">
                <Plus className="mr-2 h-5 w-5" />
                여행 그룹 만들기
              </Button>
            </CreateGroupDialog>
            <Button variant="outline" size="lg" className="px-8 py-3">
              가이드 보기
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold text-foreground">1,250+</h3>
                <p className="text-muted-foreground">활성 사용자</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <MapPin className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold text-foreground">180+</h3>
                <p className="text-muted-foreground">여행 그룹</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Calendar className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold text-foreground">520+</h3>
                <p className="text-muted-foreground">완료된 여행</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold text-foreground">95%</h3>
                <p className="text-muted-foreground">만족도</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Travel Groups Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-foreground">여행 그룹 찾기</h2>
              <p className="text-muted-foreground">마음에 드는 여행 그룹에 참여하거나 새로운 그룹을 만들어보세요</p>
            </div>
            <CreateGroupDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 그룹 만들기
              </Button>
            </CreateGroupDialog>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="여행지나 그룹명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-2">
                    <span>{category.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group) => (
                    <TravelGroupCard key={group.id} group={group} />
                  ))}
                </div>
                
                {filteredGroups.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">검색 결과가 없습니다.</p>
                    <CreateGroupDialog>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        새로운 그룹 만들기
                      </Button>
                    </CreateGroupDialog>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
