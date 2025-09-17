import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Save, X, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: number;
  username: string;
  name: string;
  nickname?: string;
  email: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else {
      loadProfile();
    }
  }, [user]);

  /** 프로필 조회 API */
  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!res.ok) throw new Error("불러오기 실패");
      const data: ProfileData = await res.json();
      setProfile(data);
      setName(data.name);
      setDirty(false);
    } catch (err) {
      toast({
        title: "불러오기 실패",
        description: "프로필 정보를 가져올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** 이름 저장 API */
  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("저장 실패");

      const updated: ProfileData = await res.json();
      setProfile(updated);
      setName(updated.name);
      setDirty(false);

      toast({
        title: "저장 완료",
        description: "이름이 업데이트되었습니다.",
      });
    } catch (e) {
      toast({
        title: "저장 실패",
        description: "입력값 검증 또는 네트워크 오류",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setName(profile.name);
    setDirty(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "로그아웃", description: "성공적으로 로그아웃되었습니다." });
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">프로필을 불러올 수 없습니다.</div>;
  }

  return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">마이페이지</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto space-y-6">
            {/* Profile */}
            <Card>
              <CardHeader className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={undefined} alt={profile.name} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {profile.name.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{profile.email}</CardTitle>
                <CardDescription>내 프로필</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">이름</label>
                  <div className="flex gap-2">
                    <Input
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setDirty(e.target.value !== profile.name);
                        }}
                    />
                    {dirty ? (
                        <>
                          <Button size="sm" onClick={handleSave} disabled={saving}>
                            <Save className="h-4 w-4 mr-1" />
                            저장
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                            <X className="h-4 w-4 mr-1" />
                            취소
                          </Button>
                        </>
                    ) : (
                        <Button size="sm" variant="outline" disabled>
                          변경 없음
                        </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
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
      </div>
  );
};

export default Profile;