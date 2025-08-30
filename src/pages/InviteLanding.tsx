
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Calendar, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
    if (inviteCode) {
      checkInviteValidity();
    }
  }, [inviteCode, user]);

  const checkInviteValidity = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with your backend API call
      // Mock validation
      if (inviteCode === 'invalid') {
        setInviteValid(false);
        return;
      }

      // Mock group info
      setGroupInfo({
        id: '1',
        title: "제주도 힐링 여행 🌴",
        destination: "제주도",
        memberCount: 4,
        dateRange: "3월 15일 - 18일",
        members: [
          { name: "김민수", avatar: "" },
          { name: "이지은", avatar: "" },
          { name: "박정우", avatar: "" },
          { name: "최유리", avatar: "" }
        ]
      });

      setInviteValid(true);
    } catch (error) {
      console.error('Error checking invite validity:', error);
      setInviteValid(false);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!groupInfo) return;

    try {
      setJoining(true);

      // TODO: Replace with your backend API call
      
      toast({
        title: "그룹에 참여했습니다!",
        description: `${groupInfo.title}에 오신 것을 환영합니다.`,
      });

      navigate(`/group/${groupInfo.id}`);
    } catch (error) {
      toast({
        title: "참여 실패",
        description: "그룹 참여 중 오류가 발생했습니다.",
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
            <p className="text-muted-foreground mb-6">
              초대 링크가 만료되었거나 유효하지 않습니다.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              홈으로 돌아가기
            </Button>
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
            <p className="text-muted-foreground mb-6">
              이미 이 그룹의 멤버입니다.
            </p>
            <Button onClick={() => navigate(`/group/${groupInfo?.id}`)} className="w-full">
              그룹으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">그룹 초대</CardTitle>
              <CardDescription>
                여행 그룹에 참여하시겠습니까?
              </CardDescription>
            </CardHeader>
            
            {groupInfo && (
              <CardContent className="space-y-6">
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

                <div className="space-y-3">
                  {user ? (
                    <Button onClick={joinGroup} disabled={joining} className="w-full" size="lg">
                      {joining ? "참여 중..." : "그룹에 참여하기"}
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="w-full" size="lg">
                      로그인하고 참여하기
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                    나중에 하기
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InviteLanding;
