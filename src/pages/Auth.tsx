import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  const { signIn, signUp, startKakaoLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleKakaoLogin = async () => {
    try {
      setKakaoLoading(true);
      const res = await fetch("/api/auth/kakao/login-url", { credentials: "include" });
      if (!res.ok) throw new Error("카카오 로그인 URL을 가져오지 못했습니다.");
      const data: { authorizeUrl: string } = await res.json();
      // 카카오 동의 화면으로 이동 (백엔드에서 redirect_uri 로 콜백되고, 거기서 우리 JWT 쿠키를 세팅하고 프론트로 302 리다이렉트됩니다)
      window.location.href = data.authorizeUrl;
    } catch (e: any) {
      toast({
        title: "카카오 로그인 준비 실패",
        description: e?.message ?? "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setKakaoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(username, password);
        if (error) {
          toast({
            title: "로그인 실패",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "로그인 성공",
            description: "환영합니다!",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(username, password, name);
        if (error) {
          toast({
            title: "회원가입 실패",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "회원가입 성공",
            description: "로그인해주세요.",
          });
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isLogin ? "로그인" : "회원가입"}
              </CardTitle>
              <CardDescription>
                {isLogin ? "계정에 로그인하세요" : "새 계정을 만드세요"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">아이디</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "처리 중..." : (isLogin ? "로그인" : "회원가입")}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">또는</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Kakao Login */}
              <Button
                type="button"
                onClick={handleKakaoLogin}
                disabled={kakaoLoading}
                className="w-full bg-[#FEE500] text-black hover:opacity-90"
              >
                {kakaoLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    카카오로 이동 중...
                  </>
                ) : (
                  <>
                    {/* Simple Kakao bubble icon (SVG) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mr-2 h-4 w-4"
                      aria-hidden
                    >
                      <path d="M12 3C6.477 3 2 6.582 2 11c0 2.63 1.69 4.94 4.276 6.305-.153.574-.555 2.07-.64 2.4-.101.396.144.39.304.284.125-.083 1.99-1.36 2.79-1.91.417.06.846.091 1.27.091 5.523 0 10-3.582 10-8s-4.477-7.17-10-7.17Z" />
                    </svg>
                    카카오로 계속하기
                  </>
                )}
              </Button>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm"
                >
                  {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
