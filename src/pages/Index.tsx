
import { useState } from "react";
import Header from "@/components/Header";
import TravelGroupCard from "@/components/TravelGroupCard";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plane, Heart, Star } from "lucide-react";

// 임시 데이터
const mockGroups = [
  {
    id: "1",
    title: "제주도 힐링 여행 🌴",
    destination: "제주도",
    status: "voting" as const,
    memberCount: 4,
    dateRange: "3월 15일 - 18일",
    lastMessage: "숙소 투표 시작했어요!",
    unreadCount: 3,
    members: [
      { name: "김민수", avatar: "" },
      { name: "이지은", avatar: "" },
      { name: "박정우", avatar: "" },
      { name: "최유리", avatar: "" }
    ]
  },
  {
    id: "2",
    title: "부산 맛집 탐방 🦐",
    destination: "부산",
    status: "planning" as const,
    memberCount: 3,
    dateRange: "4월 1일 - 3일",
    lastMessage: "언제가 좋을까요?",
    unreadCount: 1,
    members: [
      { name: "홍길동", avatar: "" },
      { name: "김철수", avatar: "" },
      { name: "이영희", avatar: "" }
    ]
  },
  {
    id: "3",
    title: "강릉 바다 여행 🌊",
    destination: "강릉",
    status: "confirmed" as const,
    memberCount: 5,
    dateRange: "5월 10일 - 12일",
    lastMessage: "숙소 예약 완료!",
    unreadCount: 0,
    members: [
      { name: "박민지", avatar: "" },
      { name: "정수빈", avatar: "" },
      { name: "김태영", avatar: "" },
      { name: "이소연", avatar: "" },
      { name: "최준호", avatar: "" }
    ]
  }
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && group.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center space-y-6">
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              친구들과 함께하는<br />
              <span className="gradient-text">완벽한 여행</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              일정 조율부터 투표, 채팅까지 모든 여행 준비를 한 곳에서
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <CreateGroupDialog />
            <Button variant="outline" size="lg">
              <Heart className="h-4 w-4 mr-2" />
              여행 가이드 보기
            </Button>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="여행 그룹 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-primary p-6 rounded-lg text-white text-center animate-float">
              <Plane className="h-8 w-8 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">3</h3>
              <p className="text-sm opacity-90">참여 중인 여행</p>
            </div>
            <div className="bg-gradient-secondary p-6 rounded-lg text-white text-center animate-float" style={{animationDelay: '1s'}}>
              <Heart className="h-8 w-8 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">12</h3>
              <p className="text-sm opacity-90">찜한 장소</p>
            </div>
            <div className="bg-accent p-6 rounded-lg text-white text-center animate-float" style={{animationDelay: '2s'}}>
              <Star className="h-8 w-8 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">4.8</h3>
              <p className="text-sm opacity-90">여행 만족도</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="planning">계획 중</TabsTrigger>
              <TabsTrigger value="voting">투표 중</TabsTrigger>
              <TabsTrigger value="confirmed">확정됨</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">해당하는 여행 그룹이 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group, index) => (
                    <div key={group.id} style={{animationDelay: `${index * 0.1}s`}}>
                      <TravelGroupCard {...group} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Index;
