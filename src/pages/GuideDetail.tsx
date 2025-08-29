import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  DollarSign,
  Phone,
  Globe,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// 임시 상세 가이드 데이터
const guideDetails = {
  "1": {
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
    budget: "30-40만원",
    author: {
      id: "author1",
      name: "여행작가 김민수",
      avatar: "/placeholder.svg",
      trips: 127
    },
    overview: "제주도의 아름다운 자연과 독특한 문화를 체험할 수 있는 특별한 여행 코스입니다. 렌터카를 이용한 드라이브 코스와 함께 제주도만의 매력을 만끽하세요.",
    itinerary: [
      {
        day: 1,
        title: "제주 도착 & 서귀포 탐방",
        activities: [
          { time: "09:00", place: "제주국제공항 도착", description: "렌터카 픽업" },
          { time: "11:00", place: "성산일출봉", description: "유네스코 세계자연유산 탐방" },
          { time: "13:00", place: "성산포 맛집", description: "제주 해산물 점심" },
          { time: "15:00", place: "섭지코지", description: "드라마 촬영지 방문" },
          { time: "18:00", place: "서귀포 숙소 체크인", description: "호텔 휴식" }
        ]
      },
      {
        day: 2,
        title: "한라산 & 중문 관광단지",
        activities: [
          { time: "08:00", place: "한라산 등반", description: "윗세오름까지 트레킹" },
          { time: "14:00", place: "중문 관광단지", description: "천제연폭포, 주상절리대" },
          { time: "17:00", place: "중문해수욕장", description: "해변 산책" },
          { time: "19:00", place: "중문 맛집 투어", description: "흑돼지 BBQ" }
        ]
      },
      {
        day: 3,
        title: "제주시 & 애월 해안도로",
        activities: [
          { time: "10:00", place: "제주민속촌", description: "제주 전통문화 체험" },
          { time: "13:00", place: "동문시장", description: "제주 특산품 쇼핑" },
          { time: "15:00", place: "애월 해안도로", description: "카페 투어" },
          { time: "18:00", place: "한담해안산책로", description: "일몰 감상" }
        ]
      }
    ],
    restaurants: [
      { name: "올래국수", type: "국수", price: "8,000원", rating: 4.5 },
      { name: "돈사돈", type: "흑돼지", price: "25,000원", rating: 4.7 },
      { name: "성산포 횟집", type: "해산물", price: "30,000원", rating: 4.6 }
    ],
    accommodation: [
      { name: "라마다플라자 제주호텔", type: "호텔", price: "120,000원/박", rating: 4.3 },
      { name: "제주 신화월드 랜딩스", type: "리조트", price: "180,000원/박", rating: 4.6 }
    ]
  }
};

const GuideDetail = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  // 일정 가져오기 다이얼로그 상태
  const [importOpen, setImportOpen] = useState(false);
  const myGroups = [
    { id: "g1", name: "제주도 힐링 여행" },
    { id: "g2", name: "부산 미식 여행" }
  ];
  const [targetGroupId, setTargetGroupId] = useState(myGroups[0]?.id || "");
  type RangeMode = "all" | "days"; // 전체 or 여러 Day 개별 지정
  const [rangeMode, setRangeMode] = useState<RangeMode>("all");
  const [startDate, setStartDate] = useState<string>(""); // 전체 가져오기일 때 Day1 시작일
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 선택된 Day 목록
  const [dayDates, setDayDates] = useState<Record<number, string>>({}); // Day별 개별 날짜

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const setDayDate = (day: number, date: string) => {
    setDayDates((prev) => ({ ...prev, [day]: date }));
  };

  const guide = guideDetails[guideId as keyof typeof guideDetails];

  if (!guide) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">가이드를 찾을 수 없습니다</h2>
          <Link to="/travel-guide">
            <Button>가이드 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToSchedule = () => {
    setImportOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "링크가 복사되었습니다!",
      description: "다른 사람들과 공유해보세요.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80">
        <img
          src={guide.image}
          alt={guide.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-4 left-4">
          <Link to="/travel-guide">
            <Button variant="ghost" size="icon" className="bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 hover:bg-white/30 text-white"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <Badge className="mb-2">{guide.category}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{guide.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{guide.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Guide Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground">가이드 소개</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-foreground mb-4">{guide.overview}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {guide.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{guide.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{guide.budget}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-foreground">
                    <Users className="h-4 w-4" />
                    <span>2-4명 추천</span>
                  </div>
                  <div className="flex items-center space-x-2 text-foreground">
                    <Clock className="h-4 w-4" />
                    <span>여유로운 일정</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-foreground">가이드 작성자</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={guide.author.avatar}
                    alt={guide.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">{guide.author.name}</h4>
                    <p className="text-sm text-muted-foreground">{guide.author.trips}개의 여행기</p>
                  </div>
                </div>
                <Link to={`/guide/${guideId}/contact`}>
                  <Button className="w-full mb-2">
                    <Phone className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                </Link>
                <Link to={`/author/${guide.author.id}/guides`}>
                  <Button variant="outline" className="w-full">
                    <Globe className="h-4 w-4 mr-2" />
                    다른 가이드 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="itinerary">일정표</TabsTrigger>
            <TabsTrigger value="restaurants">맛집</TabsTrigger>
            <TabsTrigger value="accommodation">숙소</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="mt-6">
            <div className="space-y-6">
              {guide.itinerary.map((day) => (
                <Card key={day.day}>
                  <CardHeader>
                    <CardTitle className="text-foreground">Day {day.day} - {day.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {day.activities.map((activity, index) => (
                        <div key={index} className="flex space-x-4 pb-4 border-b last:border-b-0">
                          <div className="flex-shrink-0">
                            <Badge variant="outline">{activity.time}</Badge>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{activity.place}</h4>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="restaurants" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guide.restaurants.map((restaurant, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{restaurant.name}</h4>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="secondary">{restaurant.type}</Badge>
                      <span className="text-foreground">{restaurant.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accommodation" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guide.accommodation.map((hotel, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{hotel.name}</h4>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="secondary">{hotel.type}</Badge>
                      <span className="text-foreground">{hotel.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" onClick={handleAddToSchedule}>
            <Calendar className="h-4 w-4 mr-2" />
            일정에 추가하기
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            공유하기
          </Button>
        </div>

      {/* 일정으로 가져오기 다이얼로그 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>일정으로 가져오기</DialogTitle>
            <DialogDescription>
              가이드를 내 그룹 일정으로 가져오는 방식을 선택하세요.
            </DialogDescription>
          </DialogHeader>

          {/* 그룹 선택 */}
          <div className="space-y-2">
            <Label>그룹 선택</Label>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="그룹을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {myGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 가져올 범위 */}
          <div className="mt-4 space-y-2">
            <Label>가져올 범위</Label>
            <RadioGroup
              value={rangeMode}
              onValueChange={(v) => setRangeMode(v as RangeMode)}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-md">
                <RadioGroupItem id="range-all" value="all" />
                <Label htmlFor="range-all" className="cursor-pointer">전체</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md">
                <RadioGroupItem id="range-days" value="days" />
                <Label htmlFor="range-days" className="cursor-pointer">특정 일자</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 모드별 입력 */}
          {rangeMode === "all" && (
            <div className="mt-2 space-y-2">
              <Label>Day 1 시작 날짜</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">선택한 날짜를 Day 1로 삼아 순서대로 일정이 배치됩니다.</p>
            </div>
          )}

          {rangeMode === "days" && (
            <div className="mt-2 space-y-4">
              <div className="space-y-2">
                <Label>가져올 Day 선택</Label>
                <div className="flex flex-wrap gap-2">
                  {guide.itinerary.map((d) => (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => toggleDay(d.day)}
                      className={`px-3 py-1 rounded-full border text-sm ${selectedDays.includes(d.day) ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                    >
                      Day {d.day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">여러 Day를 자유롭게 선택하세요. 각 Day별로 날짜를 지정할 수 있습니다.</p>
              </div>

              {selectedDays.length > 0 && (
                <div className="space-y-3">
                  <Label>선택한 Day의 날짜 지정</Label>
                  <div className="space-y-2">
                    {selectedDays.sort((a,b)=>a-b).map((day) => (
                      <div key={day} className="grid grid-cols-2 gap-3 items-center">
                        <div className="text-sm font-medium">Day {day}</div>
                        <Input
                          type="date"
                          value={dayDates[day] || ''}
                          onChange={(e) => setDayDate(day, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 확인 버튼 */}
          <div className="mt-6 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                // 간단한 유효성 검사
                if (rangeMode === "all") {
                  if (!startDate) {
                    toast({ title: "시작 날짜를 선택하세요" });
                    return;
                  }
                } else {
                  if (selectedDays.length === 0) {
                    toast({ title: "가져올 Day를 선택하세요" });
                    return;
                  }
                  const missing = selectedDays.filter((d) => !dayDates[d]);
                  if (missing.length > 0) {
                    toast({ title: `날짜가 지정되지 않은 Day가 있어요: Day ${missing.sort((a,b)=>a-b).join(', ')}` });
                    return;
                  }
                }

                // 실제로는 API 호출 등을 통해 그룹 캘린더로 복사합니다.
                setImportOpen(false);
                toast({
                  title: "일정에 추가되었습니다!",
                  description:
                    rangeMode === "all"
                      ? `${guide.title}의 전체 일정이 ${startDate}부터 추가됩니다.`
                      : selectedDays
                          .sort((a,b)=>a-b)
                          .map((d) => `Day ${d} → ${dayDates[d]}`)
                          .join(" · "),
                });
              }}
            >
              가져오기
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setImportOpen(false)}>취소</Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default GuideDetail;
