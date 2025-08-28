
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, MessageCircle, Vote, Calculator, ArrowLeft } from "lucide-react";
import GroupCalendar from "@/components/GroupCalendar";
import GroupChat from "@/components/GroupChat";
import VotingSystem from "@/components/VotingSystem";
import PaymentCalculator from "@/components/PaymentCalculator";

// 임시 데이터
const mockGroupData = {
  id: "1",
  title: "제주도 힐링 여행 🌴",
  destination: "제주도",
  status: "voting" as const,
  memberCount: 4,
  dateRange: "3월 15일 - 18일",
  description: "친구들과 함께하는 힐링 여행입니다. 맛있는 음식도 먹고 예쁜 카페도 가요!",
  members: [
    { id: "1", name: "김민수", avatar: "", isAdmin: true },
    { id: "2", name: "이지은", avatar: "", isAdmin: false },
    { id: "3", name: "박정우", avatar: "", isAdmin: false },
    { id: "4", name: "최유리", avatar: "", isAdmin: false }
  ]
};

const GroupDetail = () => {
  const { groupId } = useParams();
  const [activeTab, setActiveTab] = useState("calendar");
  
  // 실제로는 groupId를 사용해서 데이터를 가져올 것
  const group = mockGroupData;

  const statusConfig = {
    planning: { label: "계획 중", color: "bg-blue-500" },
    voting: { label: "투표 중", color: "bg-orange-500" },
    confirmed: { label: "확정됨", color: "bg-green-500" },
    completed: { label: "완료", color: "bg-gray-500" }
  };

  const statusInfo = statusConfig[group.status];

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
                <h1 className="text-2xl font-bold">{group.title}</h1>
                <p className="text-muted-foreground">{group.destination} • {group.dateRange}</p>
              </div>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Group Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>그룹 정보</span>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">{group.memberCount}명</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{group.description}</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">멤버:</span>
              <div className="flex -space-x-2">
                {group.members.map((member) => (
                  <div key={member.id} className="relative">
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {member.isAdmin && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>일정</span>
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center space-x-2">
              <Vote className="h-4 w-4" />
              <span>투표</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>채팅</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>결제</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <GroupCalendar groupId={group.id} />
          </TabsContent>

          <TabsContent value="voting" className="mt-6">
            <VotingSystem groupId={group.id} />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <GroupChat groupId={group.id} />
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <PaymentCalculator groupId={group.id} members={group.members} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupDetail;
