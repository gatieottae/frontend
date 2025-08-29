import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, MessageCircle, Vote, Calculator, ArrowLeft, UserPlus, Pencil } from "lucide-react";
import GroupCalendar from "@/components/GroupCalendar";
import GroupChat from "@/components/GroupChat";
import VotingSystem from "@/components/VotingSystem";
import PaymentCalculator from "@/components/PaymentCalculator";
import InviteManagementDialog from "@/components/InviteManagementDialog";

// 임시 데이터
const mockGroupData = {
  id: "1",
  title: "제주도 힐링 여행 🌴",
  destination: "제주도",
  memberCount: 4,
  startDate: "2025-03-15",
  endDate: "2025-03-18",
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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const [group, setGroup] = useState(mockGroupData);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    title: mockGroupData.title,
    destination: mockGroupData.destination,
    startDate: mockGroupData.startDate,
    endDate: mockGroupData.endDate,
    description: mockGroupData.description,
  });

  const handleSaveGroup = () => {
    setGroup(prev => ({
      ...prev,
      title: form.title,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
    }));
    setEditOpen(false);
  };

  // 실제로는 groupId를 사용해서 데이터를 가져올 것
  const currentUser = "김민수"; // 임시 현재 사용자 설정

  const isAdmin = group.members.find(m => m.name === currentUser)?.isAdmin || false;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
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
                <h1 className="text-2xl font-bold">{group.title}</h1>
                <p className="text-muted-foreground">{group.destination} • {formatDate(group.startDate)} - {formatDate(group.endDate)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    그룹 수정
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    친구 초대
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-6">
        {/* Group Info Card */}
        <div className="container mx-auto px-4">
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
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="container mx-auto px-4">
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
          </div>

          <TabsContent value="calendar" className="mt-6">
            <GroupCalendar groupId={group.id} />
          </TabsContent>

          <TabsContent value="voting" className="mt-6">
            <div className="container mx-auto px-4">
              <VotingSystem groupId={group.id} />
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <div className="container mx-auto px-4">
              <GroupChat groupId={group.id} />
            </div>
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <div className="container mx-auto px-4">
              <PaymentCalculator groupId={group.id} members={group.members} currentUser={currentUser} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Group Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>그룹 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">그룹명</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="destination">여행지</Label>
              <Input id="destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="startDate">여행 시작일</Label>
              <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="endDate">여행 종료일</Label>
              <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="description">소개</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSaveGroup}>저장</Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>취소</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Management Dialog */}
      <InviteManagementDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        groupId={group.id}
        groupName={group.title}
      />
    </div>
  );
};

export default GroupDetail;
