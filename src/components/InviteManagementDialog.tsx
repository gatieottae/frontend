
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
  const [invitations, setInvitations] = useState<Invitation[]>([
    // 예시 데이터 추가
    {
      id: "1",
      invite_code: "ABC123",
      status: "pending",
      expires_at: "2024-03-16T10:00:00Z",
      created_at: "2024-03-15T10:00:00Z"
    }
  ]);

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
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
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
                  보낸 초대들의 상태를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>보낸 초대가 없습니다</p>
                    <p className="text-sm">링크로 친구를 초대해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            코드: {invitation.invite_code}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invitation.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        {getStatusBadge(invitation.status)}
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
