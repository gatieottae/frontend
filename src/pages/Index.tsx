
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, User, MapPin } from "lucide-react";
import TravelGroupCard from "@/components/TravelGroupCard";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

const mockGroups = [
  {
    id: "1",
    title: "제주도 여행",
    destination: "제주도",
    status: "voting" as const,
    memberCount: 4,
    dateRange: "3월 15일 - 18일",
    lastMessage: "숙소 투표해주세요!",
    unreadCount: 2,
    members: [
      { name: "김민수", avatar: "" },
      { name: "이지은", avatar: "" },
      { name: "박정우", avatar: "" },
      { name: "최유리", avatar: "" }
    ]
  },
  {
    id: "2", 
    title: "부산 여행",
    destination: "부산",
    status: "confirmed" as const,
    memberCount: 3,
    dateRange: "2월 20일 - 22일",
    lastMessage: "KTX 예약 완료!",
    unreadCount: 0,
    members: [
      { name: "김민수", avatar: "" },
      { name: "이지은", avatar: "" },
      { name: "박정우", avatar: "" }
    ]
  },
  {
    id: "3",
    title: "강릉 여행", 
    destination: "강릉",
    status: "completed" as const,
    memberCount: 5,
    dateRange: "1월 15일 - 17일",
    lastMessage: "정산 완료했습니다",
    unreadCount: 0,
    members: [
      { name: "김민수", avatar: "" },
      { name: "이지은", avatar: "" },
      { name: "박정우", avatar: "" },
      { name: "최유리", avatar: "" },
      { name: "홍길동", avatar: "" }
    ]
  },
  {
    id: "4",
    title: "경주 여행",
    destination: "경주", 
    status: "planning" as const,
    memberCount: 2,
    dateRange: "4월 10일 - 12일",
    lastMessage: "일정 논의 중",
    unreadCount: 1,
    members: [
      { name: "김민수", avatar: "" },
      { name: "이지은", avatar: "" }
    ]
  }
];

const Index = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const filterGroupsByStatus = (status: string) => {
    if (status === "all") return mockGroups;
    if (status === "planning") {
      return mockGroups.filter(group => {
        const dDay = calculateDDay(group.dateRange);
        return dDay && dDay.startsWith("D-");
      });
    }
    if (status === "ongoing") {
      return mockGroups.filter(group => {
        const dDay = calculateDDay(group.dateRange);
        return dDay === "여행 중";
      });
    }
    if (status === "completed") {
      return mockGroups.filter(group => {
        const dDay = calculateDDay(group.dateRange);
        return dDay === "완료";
      });
    }
    return mockGroups;
  };

  // D-day 계산 함수 (TravelGroupCard와 동일)
  const calculateDDay = (dateRange: string) => {
    const startDateMatch = dateRange.match(/(\d+)월\s*(\d+)일/);
    const endDateMatch = dateRange.match(/(\d+)일$/);
    
    if (!startDateMatch) return null;
    
    const month = parseInt(startDateMatch[1]);
    const startDay = parseInt(startDateMatch[2]);
    const endDay = endDateMatch ? parseInt(endDateMatch[1]) : startDay;
    const currentYear = new Date().getFullYear();
    
    const travelStartDate = new Date(currentYear, month - 1, startDay);
    const travelEndDate = new Date(currentYear, month - 1, endDay);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    travelStartDate.setHours(0, 0, 0, 0);
    travelEndDate.setHours(0, 0, 0, 0);
    
    if (today > travelEndDate) {
      return "완료";
    }
    
    if (today >= travelStartDate && today <= travelEndDate) {
      return "여행 중";
    }
    
    const diffTime = travelStartDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `D-${diffDays}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">여행 플래너</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {user && <NotificationBell />}
            {user ? (
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  마이페이지
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {user ? (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">안녕하세요! 🌟</h2>
              <p className="text-muted-foreground mb-6">
                새로운 여행을 계획하거나 기존 여행을 관리해보세요
              </p>
              
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-primary hover:bg-[rgb(35,100,50)] text-white px-6 py-3"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                새 여행 그룹 만들기
              </Button>
            </div>

            {/* Travel Groups */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="planning">계획중</TabsTrigger>
                <TabsTrigger value="ongoing">여행중</TabsTrigger>
                <TabsTrigger value="completed">완료된 여행</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {filterGroupsByStatus("all").map((group) => (
                  <TravelGroupCard key={group.id} {...group} />
                ))}
              </TabsContent>
              
              <TabsContent value="planning" className="space-y-4">
                {filterGroupsByStatus("planning").map((group) => (
                  <TravelGroupCard key={group.id} {...group} />
                ))}
              </TabsContent>
              
              <TabsContent value="ongoing" className="space-y-4">
                {filterGroupsByStatus("ongoing").map((group) => (
                  <TravelGroupCard key={group.id} {...group} />
                ))}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-4">
                {filterGroupsByStatus("completed").map((group) => (
                  <TravelGroupCard key={group.id} {...group} />
                ))}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          // 로그인하지 않은 사용자를 위한 화면
          <div className="text-center py-16">
            <MapPin className="h-24 w-24 mx-auto text-primary mb-6" />
            <h2 className="text-3xl font-bold mb-4">함께하는 여행 계획</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              친구들과 함께 여행을 계획하고, 일정을 조율하며, 비용을 관리해보세요.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-[rgb(35,100,50)] text-white px-8 py-3">
                시작하기
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Create Group Dialog */}
      <CreateGroupDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default Index;
