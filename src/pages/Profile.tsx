
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MapPin, Calendar, CreditCard, Settings, LogOut, Edit, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const [user] = useState({
    name: '김민수',
    email: 'minsu@example.com',
    avatar: '',
    joinDate: '2024년 1월',
    totalTrips: 12,
    completedTrips: 8,
    rating: 4.8,
    bio: '여행을 사랑하는 개발자입니다. 새로운 경험을 추구하며 좋은 사람들과 함께하는 여행을 선호합니다.'
  });

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
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
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
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {user.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-foreground">{user.name}</CardTitle>
                    <CardDescription className="text-base">{user.email}</CardDescription>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{user.joinDate} 가입</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  프로필 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{user.bio}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.totalTrips}</div>
                  <div className="text-sm text-muted-foreground">총 여행</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.completedTrips}</div>
                  <div className="text-sm text-muted-foreground">완료 여행</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-2xl font-bold text-primary">{user.rating}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">평점</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.totalTrips - user.completedTrips}</div>
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
                  {index < recentTrips.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">빠른 기능</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-12">
                <CreditCard className="h-4 w-4 mr-3" />
                결제 내역
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <Settings className="h-4 w-4 mr-3" />
                계정 설정
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <MapPin className="h-4 w-4 mr-3" />
                위시리스트
              </Button>
              <Button variant="outline" className="justify-start h-12 text-destructive hover:text-destructive">
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
