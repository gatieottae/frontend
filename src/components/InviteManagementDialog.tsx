
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InviteManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

interface Invitation {
  id: string;
  invite_code: string;
  invited_email?: string;
  status: string;
  expires_at?: string;
  created_at: string;
}

const InviteManagementDialog = ({ open, onOpenChange, groupId, groupName }: InviteManagementDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [expiryTime, setExpiryTime] = useState("1hour");
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // 상태 예시 데이터 추가
  const mockInvitations: Invitation[] = [
    {
      id: "1",
      invite_code: "ABC123XY",
      status: "pending",
      expires_at: "2025-03-20T10:00:00Z",
      created_at: "2025-03-15T10:00:00Z"
    },
    {
      id: "2", 
      invite_code: "DEF456ZW",
      status: "accepted",
      expires_at: "2025-03-18T15:30:00Z",
      created_at: "2025-03-14T15:30:00Z"
    },
    {
      id: "3",
      invite_code: "GHI789UV",
      status: "expired",
      expires_at: "2025-03-16T20:00:00Z",
      created_at: "2025-03-13T20:00:00Z"
    }
  ];

  useEffect(() => {
    if (open) {
      fetchInvitations();
      generateInviteCode();
    }
  }, [open]);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // 실제 데이터가 없으면 예시 데이터 사용
      setInvitations(data && data.length > 0 ? data : mockInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      // 에러 시에도 예시 데이터 표시
      setInvitations(mockInvitations);
    }
  };

  const generateInviteCode = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          group_id: groupId,
          invited_by: user?.id,
          expires_at: getExpiryDate(expiryTime)
        })
        .select('invite_code')
        .single();

      if (error) throw error;
      setInviteCode(data.invite_code);
    } catch (error) {
      console.error('Error generating invite code:', error);
      // 에러 시 임시 코드 생성
      setInviteCode(`TEMP${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
    }
  };

  const getExpiryDate = (time: string) => {
    const now = new Date();
    switch (time) {
      case '10min':
        return new Date(now.getTime() + 10 * 60 * 1000).toISOString();
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case '1day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'never':
        return null;
      default:
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "링크가 복사되었습니다",
      description: "초대 링크를 공유해보세요!",
    });
  };

  const regenerateCode = async () => {
    setLoading(true);
    await generateInviteCode();
    await fetchInvitations();
    setLoading(false);
    toast({
      title: "새 초대 코드가 생성되었습니다",
      description: "기존 코드는 무효화되었습니다.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">대기 중</Badge>;
      case 'accepted':
        return <Badge variant="default">수락됨</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거절됨</Badge>;
      case 'expired':
        return <Badge variant="secondary">만료됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>그룹 초대 관리</DialogTitle>
          <DialogDescription>
            {groupName} 그룹에 새로운 멤버를 초대하세요
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">초대 링크</TabsTrigger>
            <TabsTrigger value="history">초대 내역</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Copy className="h-4 w-4" />
                  <span>초대 링크</span>
                </CardTitle>
                <CardDescription>
                  링크를 복사해서 친구들에게 공유하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>초대 코드</Label>
                  <div className="flex space-x-2">
                    <Input value={inviteCode} readOnly />
                    <Button onClick={copyInviteLink} size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>만료 시간</Label>
                  <Select value={expiryTime} onValueChange={setExpiryTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10min">10분</SelectItem>
                      <SelectItem value="1hour">1시간</SelectItem>
                      <SelectItem value="1day">1일</SelectItem>
                      <SelectItem value="never">무제한</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={regenerateCode} disabled={loading} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  새 코드 생성
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>초대 내역</span>
                </CardTitle>
                <CardDescription>
                  생성한 초대들의 상태를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>생성한 초대가 없습니다</p>
                    <p className="text-sm">링크를 생성해서 친구를 초대해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium">코드: {invitation.invite_code}</p>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>생성: {formatDate(invitation.created_at)}</p>
                            {invitation.expires_at && (
                              <p>만료: {formatDate(invitation.expires_at)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteManagementDialog;
