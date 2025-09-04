
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

  useEffect(() => {
    if (open) {
      fetchInvitations();
      generateInviteCode();
    }
  }, [open]);

  const fetchInvitations = async () => {
    try {
      // TODO: Replace with your backend API call
      // Mock invitations data
      setInvitations([
        {
          id: '1',
          invite_code: 'SAMPLE123',
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const generateInviteCode = async () => {
    try {
      // TODO: Replace with your backend API call
      // Generate mock invite code
      const mockCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      setInviteCode(mockCode);
    } catch (error) {
      console.error('Error generating invite code:', error);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "초대 코드가 복사되었습니다",
      description: "초대 코드를 공유해보세요!",
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

  const getStatusBadge = (expires_at?: string | null) => {
    const now = new Date();
    if (!expires_at) {
      return <Badge variant="default">활성</Badge>;
    }
    const exp = new Date(expires_at);
    return exp > now ? (
      <Badge variant="default">활성</Badge>
    ) : (
      <Badge variant="secondary">만료</Badge>
    );
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

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Copy className="h-4 w-4" />
                  <span>초대 코드</span>
                </CardTitle>
                <CardDescription>
                  코드를 복사해서 친구들에게 공유하세요
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

                {/*<Button onClick={regenerateCode} disabled={loading} className="w-full">*/}
                {/*  <RefreshCw className="h-4 w-4 mr-2" />*/}
                {/*  새 코드 생성*/}
                {/*</Button>*/}
              </CardContent>
            </Card>
          </TabsContent>



        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteManagementDialog;
