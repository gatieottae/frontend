import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, MessageCircle, Vote, Calculator, ArrowLeft, UserPlus, Pencil } from "lucide-react";
import GroupCalendar from "@/components/GroupCalendar";
import GroupChat from "@/components/GroupChat";
import VotingSystem from "@/components/VotingSystem";
import PaymentCalculator from "@/components/PaymentCalculator";
import InviteManagementDialog from "@/components/InviteManagementDialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

/** 백엔드 DTO 타입 */
type MemberDto = {
  id: number;
  displayName: string;
  role: "OWNER" | "MEMBER";
};
type GroupDetailDto = {
  id: number;
  name: string;
  description: string | null;
  destination: string | null;
  startDate: string | null; // yyyy-MM-dd
  endDate: string | null;   // yyyy-MM-dd
  ownerId: number;
  memberCount: number;
  members: MemberDto[];
};

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("calendar");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // 서버 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상세 데이터
  const [group, setGroup] = useState<GroupDetailDto | null>(null);

  // 수정 다이얼로그
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  // ----- 데이터 로드 -----
  useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken() || (user as any)?.accessToken || (user as any)?.token;
        const res = await fetch(`/api/groups/${groupId}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) {
          const msg = await safeText(res);
          throw new Error(msg || `그룹 정보를 불러오지 못했습니다. (HTTP ${res.status})`);
        }

        const dto: GroupDetailDto = await res.json();
        setGroup(dto);

        // 폼 채우기
        setForm({
          name: dto.name ?? "",
          destination: dto.destination ?? "",
          startDate: dto.startDate ?? "",
          endDate: dto.endDate ?? "",
          description: dto.description ?? "",
        });
      } catch (e: any) {
        setError(e?.message ?? "그룹 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // 현재 사용자 OWNER 여부 (멤버 role=OWNER or ownerId 일치)
  const isOwner = useMemo(() => {
    if (!group) return false;
    // 우선 서버가 ownerId를 주니 그걸로 판단
    // (추가로 members에 OWNER가 본인인지 확인해도 됨)
    const myId = (user as any)?.id; // 프로젝트의 user 객체 구조에 맞춰 조정
    if (myId && myId === group.ownerId) return true;

    // fallback: 토큰에 id가 없을 경우 members에 OWNER가 1명이라고 가정
    return group.members?.some(m => m.role === "OWNER") ?? false;
  }, [group, user]);

  const currentUserName = useMemo(() => {
    // 결제 컴포넌트에 넘기는 용도(임시). 실제로는 백의 내 이름을 사용하도록 교체하세요.
    return group?.members?.[0]?.displayName ?? "나";
  }, [group]);

  // 날짜 포맷
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 저장
  const handleSaveGroup = async () => {
    if (!groupId) return;
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "유효성 오류", description: "그룹명은 필수입니다." });
      return;
    }
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      toast({ variant: "destructive", title: "유효성 오류", description: "종료일은 시작일 이후여야 합니다." });
      return;
    }

    try {
      setSaving(true);
      const token = getAccessToken() || (user as any)?.accessToken || (user as any)?.token;

      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          destination: form.destination,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          description: form.description,
        }),
      });

      if (!res.ok) {
        const msg = await safeText(res);
        throw new Error(msg || `업데이트 실패 (HTTP ${res.status})`);
      }

      // 성공 시 최신 상세 재조회(정석) 또는 낙관적 갱신
      const updated = { ...(group as GroupDetailDto) };
      updated.name = form.name;
      updated.destination = form.destination;
      updated.startDate = form.startDate || null;
      updated.endDate = form.endDate || null;
      updated.description = form.description;
      setGroup(updated);

      toast({ title: "저장 완료", description: "그룹 정보가 수정되었습니다." });
      setEditOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "저장 실패",
        description: e?.message ?? "그룹 정보 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  // 로딩/에러 처리
  if (loading) {
    return (
        <div className="min-h-screen bg-background grid place-items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">그룹 정보를 불러오는 중...</p>
          </div>
        </div>
    );
  }
  if (error || !group) {
    return (
        <div className="min-h-screen bg-background grid place-items-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">그룹 정보를 불러오지 못했습니다.</p>
            {error ? <p className="text-muted-foreground text-sm">{error}</p> : null}
            <Button onClick={() => navigate(-1)}>뒤로 가기</Button>
          </div>
        </div>
    );
  }

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
                  <h1 className="text-2xl font-bold">{group.name}</h1>
                  <p className="text-muted-foreground">
                    {(group.destination ?? "")}
                    {" "}
                    • {formatDate(group.startDate)} - {formatDate(group.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isOwner && (
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
                            <AvatarImage src={""} />
                            <AvatarFallback className="text-xs">
                              {member.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {member.role === "OWNER" && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
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
              <GroupCalendar groupId={String(group.id)} />
            </TabsContent>

            <TabsContent value="voting" className="mt-6">
              <div className="container mx-auto px-4">
                <VotingSystem groupId={String(group.id)} />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <div className="container mx-auto px-4">
                <GroupChat
                 groupId={String(group.id)}
                 apiBase={"http://localhost:8080"}
                />
              </div>
            </TabsContent>

            <TabsContent value="payment" className="mt-6">
              <div className="container mx-auto px-4">
                <PaymentCalculator
                    groupId={String(group.id)}
                    members={group.members.map(m => ({ id: String(m.id), name: m.displayName }))}
                    currentUser={currentUserName}
                />
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
                <Label htmlFor="name">그룹명</Label>
                <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="destination">여행지</Label>
                <Input
                    id="destination"
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate">여행 시작일</Label>
                  <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">여행 종료일</Label>
                  <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">소개</Label>
                <Textarea
                    id="description"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSaveGroup} disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)} disabled={saving}>
                  취소
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite Management Dialog */}
        <InviteManagementDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            groupId={String(group.id)}
            groupName={group.name}
        />
      </div>
  );
};

export default GroupDetail;

/** 토큰 가져오기: 프로젝트에 맞게 교체하세요 */
function getAccessToken(): string | null {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}
async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}