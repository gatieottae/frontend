import { useState, useEffect, useMemo } from "react";
import TravelGroupCard from "@/components/TravelGroupCard";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plane, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/http";

/** ---- 백엔드 DTO 타입 ---- */
type BackendGroupItem = {
  id: number;
  name: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  status?: 'BEFORE' | 'DURING' | 'AFTER';
};
type GroupsPage = { items: BackendGroupItem[]; nextCursor?: string | null };

/** ---- UI용 매핑 타입 (카드가 기대하는 형태) ---- */
type UiGroup = {
  id: string;
  title: string;
  destination: string;
  memberCount: number;
  dateRange: string;     // "YYYY-MM-DD ~ YYYY-MM-DD"
  lastMessage: string;
  unreadCount: number;
  members: { name: string; avatar: string }[];
};

/** ---- 유틸: DTO → UI 변환 ---- */
const toUiGroup = (g: BackendGroupItem): UiGroup => {
  const start = g.startDate ?? '';
  const end = g.endDate ?? g.startDate ?? '';
  return {
    id: String(g.id),
    title: g.name,
    destination: g.destination ?? '',
    memberCount: 0,        // (옵션) 상세 조회에서 memberCount 내려오면 교체
    dateRange: start && end ? `${start} ~ ${end}` : '',
    lastMessage: '',       // 목록에선 없음
    unreadCount: 0,        // 목록에선 없음
    members: []            // 목록에선 없음
  };
};

type SortOption = 'startAsc' | 'startDesc' | 'titleAsc';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;

  const [heroMinH, setHeroMinH] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "before" | "during" | "after">("all");
  const [currentText, setCurrentText] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const [sort, setSort] = useState<SortOption>('startAsc');

  // 서버 목록/커서/상태
  const [groups, setGroups] = useState<UiGroup[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 20; // 서버 페이지 사이즈 고정 (20개)

  const textOptions = ["친구와", "연인과", "가족과", "동료와"];

  // Index.tsx 상단 어딘가(컴포넌트 바깥) 또는 컴포넌트 안에 선언
  type SortOption = 'startAsc' | 'startDesc' | 'titleAsc';

  // 프론트 -> 백엔드 enum 매핑
  const mapSortToBackend = (s: SortOption) => {
    switch (s) {
      case 'startAsc':  return 'START_ASC';
      case 'startDesc': return 'START_DESC';
      case 'titleAsc':  return 'TITLE_ASC';
      default:          return 'START_ASC';
    }
  };

  useEffect(() => {
    const id = setInterval(() => setCurrentText((p) => (p + 1) % textOptions.length), 2000);
    return () => clearInterval(id);
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

  /** ---- 서버에서 그룹 목록 로드 ---- */
  const loadGroups = async (reset: boolean) => {
    if (!user) return;
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('size', String(PAGE_SIZE));

      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      // status는 백엔드가 lower-case(before/during/after) 받는다고 했으니 그대로 유지
      if (activeTab !== 'all') params.set('status', activeTab);

      // ✅ 정렬 값은 enum 문자열로 변환해서 보냄
      if (sort) params.set('sort', mapSortToBackend(sort));

      if (!reset && nextCursor) params.set('cursor', nextCursor);

      const res = await http.get<GroupsPage>("/me/groups", { params });

      const page = res.data;

      const mapped = (page.items ?? []).map(toUiGroup);

      if (reset) {
        setGroups(mapped);
      } else {
        setGroups(prev => [...prev, ...mapped]);
      }
      setNextCursor(page.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message ?? '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터/정렬 변경 시 첫 페이지부터 다시 로드
  useEffect(() => {
    if (!user) return;
    setGroups([]);
    setNextCursor(null);
    loadGroups(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchQuery, activeTab, sort]);

  return (
      <div className="min-h-screen bg-background">
        <style>{`
@keyframes floatBtn { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
.btn-float{animation:floatBtn 3s ease-in-out infinite;will-change:transform}
.btn-float-delay{animation-delay:.6s}
@media (prefers-reduced-motion: reduce){ .btn-float,.btn-float-delay{animation:none!important} }
`}</style>

        {/* Hero Section */}
        <section
            className={`px-4 ${isGuest ? 'grid place-items-center' : 'py-12'}`}
            style={isGuest ? { minHeight: heroMinH ?? 'calc(100svh - 80px)' } : undefined}
        >
          <div className="container mx-auto text-center space-y-6">
            <div className="space-y-4 animate-slide-up">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
              <span key={currentText} className="inline-block animate-fade-in text-primary">
                {textOptions[currentText]}
              </span>{" "}
                함께하는<br />
                <span className="gradient-text">완벽한 여행.</span>
              </h1>
              <p className="text-xl text-foreground max-w-2xl mx-auto">
                일정 조율부터 투표, 채팅까지 모든 여행 준비를 한 곳에서
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              {user ? (
                  <CreateGroupDialog onSuccess={() => loadGroups(true)} />
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
                  if (isGuest) navigate(`/auth?next=${encodeURIComponent(target)}`);
                  else navigate(target);
                }}
            >
              <Input
                  className="w-64 border-2 border-primary focus-visible:border-primary focus-visible:outline-none"
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
                {/* Search + Sort */}
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="여행 그룹 검색..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/*<div className="flex items-center">*/}
                  {/*  <Select value={sort} onValueChange={(v: SortOption) => setSort(v)}>*/}
                  {/*    <SelectTrigger className="min-w-[220px] sm:min-w-[260px] shrink-0">*/}
                  {/*      <SelectValue placeholder="정렬 선택" className="whitespace-nowrap" />*/}
                  {/*    </SelectTrigger>*/}
                  {/*    <SelectContent className="min-w-[220px] sm:min-w-[260px]">*/}
                  {/*      <SelectItem value="startAsc">여행 시작일 ▲ (다가올 순)</SelectItem>*/}
                  {/*      <SelectItem value="startDesc">여행 시작일 ▼ (늦은 순)</SelectItem>*/}
                  {/*      <SelectItem value="titleAsc">제목 ㄱ-ㅎ</SelectItem>*/}
                  {/*    </SelectContent>*/}
                  {/*  </Select>*/}
                  {/*</div>*/}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">전체</TabsTrigger>
                    <TabsTrigger value="before">여행 전</TabsTrigger>
                    <TabsTrigger value="during">여행 중</TabsTrigger>
                    <TabsTrigger value="after">여행 종료</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-6">
                    {error ? (
                      <div className="text-center py-12">
                        <p className="text-destructive">목록을 불러오는 중 오류가 발생했습니다.</p>
                        <p className="text-muted-foreground text-sm mt-2">{error}</p>
                        <Button className="mt-4" onClick={() => loadGroups(true)} disabled={loading}>다시 시도</Button>
                      </div>
                    ) : groups.length === 0 && !loading ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">해당하는 여행 그룹이 없습니다.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {groups.map((group, index) => (
                            <div key={group.id} style={{ animationDelay: `${index * 0.06}s` }}>
                              <TravelGroupCard {...group} />
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-center mt-8">
                          <Button onClick={() => loadGroups(false)} disabled={loading || !nextCursor}>
                            {loading ? '불러오는 중...' : (nextCursor ? '더 보기' : '더 이상 없음')}
                          </Button>
                        </div>
                      </>
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