
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MapPin, Calendar, Edit, Star, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  join_date: string;
  avatar_url: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [recentTrips] = useState([
    {
      id: '1',
      name: '제주도 여행',
      status: '진행 중',
      participants: 4,
      dates: '2024.04.15-17'
    },
    {
      id: '2', 
      name: '부산 여행',
      status: '완료',
      participants: 3,
      dates: '2024.03.08-10'
    },
    {
      id: '3',
      name: '강릉 여행',
      status: '완료', 
      participants: 5,
      dates: '2024.02.20-22'
    }
  ]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      navigate('/auth');
    }
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile({
        name: data.name || '사용자',
        email: data.email || user.email || '',
        bio: data.bio || '여행을 사랑하는 사용자입니다.',
        join_date: data.join_date ? new Date(data.join_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) : '2024년 1월',
        avatar_url: data.avatar_url || ''
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '진행 중':
        return <Badge variant="default">진행 중</Badge>;
      case '완료':
        return <Badge variant="secondary">완료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">로딩 중...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">프로필을 불러올 수 없습니다.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">마이페이지</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {profile.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-foreground">{profile.name}</CardTitle>
                    <CardDescription className="text-base">{profile.email}</CardDescription>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{profile.join_date} 가입</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setProfileEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  프로필 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{profile.bio}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-sm text-muted-foreground">총 여행</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">8</div>
                  <div className="text-sm text-muted-foreground">완료 여행</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-2xl font-bold text-primary">4.8</span>
                  </div>
                  <div className="text-sm text-muted-foreground">평점</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4</div>
                  <div className="text-sm text-muted-foreground">진행 중</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">최근 여행</CardTitle>
              <CardDescription>참여한 최근 여행 목록입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTrips.map((trip, index) => (
                <div key={trip.id}>
                  <Link to={`/group/${trip.id}`} className="block hover:bg-muted/50 p-2 -m-2 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{trip.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{trip.dates}</span>
                            <span>참가자 {trip.participants}명</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(trip.status)}
                    </div>
                  </Link>
                  {index < recentTrips.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                variant="outline" 
                className="w-full justify-center h-12 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                로그아웃
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProfileEditDialog 
        open={profileEditOpen} 
        onOpenChange={setProfileEditOpen}
        onProfileUpdate={fetchProfile}
      />
    </div>
  );
};

export default Profile;
