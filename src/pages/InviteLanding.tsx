import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Calendar, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/** 백엔드 응답 DTO(참여 성공시) */
type GroupResponseDto = {
  id: number;
  name: string;
  description?: string | null;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  inviteCode?: string | null;
};

interface GroupInfo {
  id: string;
  title: string;
  destination: string;
  memberCount: number;
  dateRange: string;
  members: Array<{ name: string; avatar?: string }>;
}

const InviteLanding = () => {
  const { inviteCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  useEffect(() => {
    if (!inviteCode) return;
    // 미리보기/유효성 점검: 현재는 전용 API가 없다고 가정.
    // - 코드 포맷이 너무 이상하면 invalid 처리
    // - 그 외에는 초대코드 입력 화면으로 진입 허용(inviteValid=true)
    //   (참여 버튼을 누르면 실제 조인 API에서 최종 판단)
    setLoading(true);
    const okFormat = String(inviteCode).trim().length >= 4;
    setInviteValid(okFormat);
    // 미리보기 데이터가 없으니 최소 정보만 표시
    setGroupInfo(null);
    setAlreadyMember(false);
    setLoading(false);
  }, [inviteCode, user]);

  const joinGroup = async () => {
    if (!inviteCode) return;
    if (!user) {
      // 로그인 필요
      navigate(`/auth?next=${encodeURIComponent(`/invite/${inviteCode}`)}`);
      return;
    }

    try {
      setJoining(true);

      const token = getAccessToken() || (user as any)?.accessToken || (user as any)?.token;
      const res = await fetch(`/api/groups/join/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: inviteCode }),
        credentials: "include",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        // 백엔드에서 GroupErrorCode를 message 등으로 내려준다고 가정
        const msg: string = data?.message || data?.error || `HTTP ${res.status}`;
        if (msg.includes("이미 그룹 멤버입니다") || msg.includes("ALREADY_MEMBER")) {
          setAlreadyMember(true);
          setInviteValid(true);
          // 그룹 id를 모르니 홈으로 안내하거나 목록으로 유도
          toast({ title: "이미 참여 중", description: "이미 이 그룹의 멤버예요." });
          return;
        }
        if (msg.includes("유효하지 않은 초대 코드") || msg.includes("INVALID_CODE")) {
          setInviteValid(false);
          toast({ variant: "destructive", title: "유효하지 않은 초대", description: "초대 코드가 올바르지 않아요." });
          return;
        }
        throw new Error(msg);
      }

      // 성공: GroupResponseDto 반환 → 상세로 이동
      const dto = data as GroupResponseDto;
      toast({ title: "그룹에 참여했습니다!", description: `"${dto.name}"에 오신 것을 환영합니다.` });
      navigate(`/group/${dto.id}`);
    } catch (error: any) {
      toast({
        title: "참여 실패",
        description: error?.message || "그룹 참여 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">초대 정보를 확인하는 중...</p>
          </div>
        </div>
    );
  }

  if (!inviteValid) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">유효하지 않은 초대</h2>
              <p className="text-muted-foreground mb-6">초대 링크가 만료되었거나 유효하지 않습니다.</p>
              <Button onClick={() => navigate('/')} className="w-full">홈으로 돌아가기</Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (alreadyMember) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">이미 참여 중</h2>
              <p className="text-muted-foreground mb-6">이미 이 그룹의 멤버입니다.</p>
              <Button onClick={() => navigate('/')} className="w-full">홈으로</Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  // 미리보기 API가 없으므로 최소 정보만 노출
  return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">그룹 초대</CardTitle>
                <CardDescription>여행 그룹에 참여하시겠습니까?</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {groupInfo ? (
                    <>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">{groupInfo.title}</h3>
                        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {groupInfo.destination}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {groupInfo.dateRange}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">멤버 {groupInfo.memberCount}명</span>
                        </div>

                        <div className="flex justify-center -space-x-2">
                          {groupInfo.members.slice(0, 5).map((member, index) => (
                              <Avatar key={index} className="h-10 w-10 border-2 border-background">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="text-sm">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                          ))}
                          {groupInfo.members.length > 5 && (
                              <div className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm font-medium">
                                +{groupInfo.members.length - 5}
                              </div>
                          )}
                        </div>
                      </div>
                    </>
                ) : (
                    <div className="text-center text-sm text-muted-foreground">
                      초대코드: <span className="font-mono">{inviteCode}</span>
                    </div>
                )}

                <div className="space-y-3">
                  <Button onClick={joinGroup} disabled={joining} className="w-full" size="lg">
                    {joining ? "참여 중..." : "그룹에 참여하기"}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                    나중에 하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default InviteLanding;

/** 토큰/JSON 유틸 */
function getAccessToken(): string | null {
  try { return localStorage.getItem("accessToken"); } catch { return null; }
}
async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}