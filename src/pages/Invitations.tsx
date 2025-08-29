
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Check, X, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Invitation {
  id: string;
  group_id: string;
  invite_code: string;
  invited_by: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

const Invitations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchInvitations();
  }, [user, navigate]);

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .or(`invited_user_id.eq.${user.id},invited_email.eq.${user.email}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      if (action === 'accept') {
        // Add user to group
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: invitation.group_id,
            user_id: user?.id,
            role: 'member'
          });

        if (memberError) throw memberError;
      }

      // Update invitation status
      const { error } = await supabase
        .from('invitations')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: action === 'accept' ? "초대를 수락했습니다" : "초대를 거절했습니다",
        description: action === 'accept' ? "그룹에 참여되었습니다." : "초대가 거절되었습니다.",
      });

      await fetchInvitations();

      if (action === 'accept') {
        navigate(`/group/${invitation.group_id}`);
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold ml-4">받은 초대</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">초대 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2 ml-4">
            <Mail className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">받은 초대</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">받은 초대가 없습니다</h3>
                <p className="text-muted-foreground mb-6">
                  친구들이 보낸 초대가 여기에 표시됩니다
                </p>
                <Link to="/">
                  <Button>홈으로 돌아가기</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">여행 그룹 초대</CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(invitation.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          {invitation.expires_at && (
                            <span className="text-orange-600">
                              만료: {new Date(invitation.expires_at).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">대기 중</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        수락
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleInvitationResponse(invitation.id, 'reject')}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        거절
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invitations;
