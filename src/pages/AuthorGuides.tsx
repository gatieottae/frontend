
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Star, Calendar, DollarSign } from "lucide-react";

const AuthorGuides = () => {
  const { authorId } = useParams();
  
  const authorInfo = {
    name: "여행작가 김민수",
    avatar: "/placeholder.svg",
    trips: 127,
    rating: 4.8,
    followers: 1240,
    bio: "여행을 사랑하는 작가입니다. 숨겨진 명소와 현지 맛집을 찾아다니며 특별한 여행 경험을 공유합니다."
  };

  const guides = [
    {
      id: "1",
      title: "제주도 3박 4일 완벽 가이드",
      location: "제주도",
      duration: "3박 4일",
      budget: "30-40만원",
      rating: 4.8,
      reviewCount: 245,
      image: "/placeholder.svg",
      category: "자연",
      tags: ["힐링", "자연", "드라이브"]
    },
    {
      id: "2", 
      title: "부산 맛집 투어 가이드",
      location: "부산",
      duration: "2박 3일",
      budget: "20-30만원",
      rating: 4.7,
      reviewCount: 189,
      image: "/placeholder.svg",
      category: "음식",
      tags: ["맛집", "해변", "문화"]
    },
    {
      id: "3",
      title: "경주 역사문화 여행",
      location: "경주",
      duration: "1박 2일",
      budget: "15-20만원",
      rating: 4.6,
      reviewCount: 156,
      image: "/placeholder.svg",
      category: "문화",
      tags: ["역사", "문화", "유적"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/travel-guide">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              가이드 목록으로
            </Button>
          </Link>
        </div>

        {/* 작가 정보 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={authorInfo.avatar} />
                <AvatarFallback>{authorInfo.name.charAt(-1)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{authorInfo.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  <span>여행기 {authorInfo.trips}개</span>
                  <span>팔로워 {authorInfo.followers}명</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{authorInfo.rating}</span>
                  </div>
                </div>
                <p className="text-muted-foreground">{authorInfo.bio}</p>
                <div className="flex space-x-2 mt-4">
                  <Button>팔로우</Button>
                  <Button variant="outline">메시지 보내기</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 가이드 목록 */}
        <div>
          <h2 className="text-xl font-bold mb-4">{authorInfo.name}의 여행 가이드 ({guides.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Card key={guide.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img 
                    src={guide.image} 
                    alt={guide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge>{guide.category}</Badge>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{guide.rating}</span>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{guide.title}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{guide.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{guide.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{guide.budget}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {guide.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      리뷰 {guide.reviewCount}개
                    </span>
                    <Link to={`/guide/${guide.id}`}>
                      <Button size="sm">자세히 보기</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorGuides;
