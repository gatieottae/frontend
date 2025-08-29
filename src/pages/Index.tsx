import { useState, useEffect } from "react";
import TravelGroupCard from "@/components/TravelGroupCard";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plane, Heart, Star, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;
  const [heroMinH, setHeroMinH] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentText, setCurrentText] = useState(0);
  const [inviteCode, setInviteCode] = useState("");

  const textOptions = ["친구와", "연인과", "가족과", "동료와"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % textOptions.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isGuest) return;
    const measure = () => {
      const headerEl = document.querySelector('header') as HTMLElement | null;
      const headerH = headerEl?.offsetHeight ?? 0;
      setHeroMinH(`calc(100svh - ${headerH}px)`);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isGuest]);

  useEffect(() => {
    if (!isGuest) return;
    const prevHtml = document.documentElement.style.overflowY;
    const prevBody = document.body.style.overflowY;
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';
    return () => {
      document.documentElement.style.overflowY = prevHtml;
      document.body.style.overflowY = prevBody;
    };
  }, [isGuest]);

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.destination.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && group.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <style>{`
@keyframes floatBtn {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.btn-float { animation: floatBtn 3s ease-in-out infinite; will-change: transform; }
.btn-float-delay { animation-delay: .6s; }
@media (prefers-reduced-motion: reduce) {
  .btn-float, .btn-float-delay { animation: none !important; }
}
`}</style>

      {/* Hero Section */}
      <section
        className={`px-4 ${isGuest ? 'grid place-items-center' : 'py-12'}`}
        style={isGuest ? { minHeight: heroMinH ?? 'calc(100svh - 80px)' } : undefined}
      >
        <div className="container mx-auto text-center space-y-6">
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
              <span
                key={currentText}
                className="inline-block animate-fade-in text-primary"
              >
                {textOptions[currentText]}
              </span>
              {" "}함께하는<br />
              <span className="gradient-text">완벽한 여행</span>
            </h1>
            <p className="text-xl text-foreground max-w-2xl mx-auto">
              일정 조율부터 투표, 채팅까지 모든 여행 준비를 한 곳에서
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            {user ? (
              <CreateGroupDialog />
            ) : (
              <Link to="/auth">
                <Button size="lg" className="btn-float">
                  <Plane className="h-4 w-4 mr-2" />
                  시작하기
                </Button>
              </Link>
            )}
            <Link to="/travel-guide">
              <Button variant="outline" size="lg">
                <Heart className="h-4 w-4 mr-2" />
                여행 가이드 보기
              </Button>
            </Link>
          </div>

          {/* 초대코드 입력 */}
          <form
            className="mt-6 flex gap-2 justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              const code = inviteCode.trim();
              if (!code) return;
              const target = `/invite/${encodeURIComponent(code)}`;
              if (isGuest) {
                navigate(`/auth?next=${encodeURIComponent(target)}`);
              } else {
                navigate(target);
              }
            }}
          >
            <Input
              className="w-64"
              placeholder="초대코드 입력"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              autoComplete="off"
              inputMode="text"
              maxLength={24}
            />
            <Button type="submit" variant="outline">참여</Button>
          </form>
        </div>
      </section>

      {/* Groups Section - Only show if user is logged in */}
      {user ? (
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
      ) : null}
    </div>
  );
};

export default Index;
