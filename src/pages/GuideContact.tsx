
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Mail, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GuideContact = () => {
  const { guideId } = useParams();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    travelDate: "",
    groupSize: ""
  });

  const guideInfo = {
    name: "여행작가 김민수",
    avatar: "/placeholder.svg",
    trips: 127,
    rating: 4.8,
    responseTime: "보통 1시간 이내",
    languages: ["한국어", "영어", "일본어"]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "문의가 전송되었습니다!",
      description: "가이드가 확인 후 연락드릴 예정입니다.",
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
      travelDate: "",
      groupSize: ""
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to={`/guide/${guideId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              가이드로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">가이드 문의하기</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 가이드 정보 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>가이드 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={guideInfo.avatar} />
                    <AvatarFallback>{guideInfo.name.charAt(-1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{guideInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">{guideInfo.trips}개의 여행기</p>
                    <p className="text-sm text-muted-foreground">평점 {guideInfo.rating}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{guideInfo.responseTime}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-medium">언어:</span>
                    <span className="text-sm">{guideInfo.languages.join(", ")}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button className="w-full" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    전화 문의
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    이메일 문의
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 문의 폼 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>문의사항을 남겨주세요</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">이름 *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="홍길동"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">이메일 *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">연락처</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="010-1234-5678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupSize">인원 수</Label>
                      <Input
                        id="groupSize"
                        name="groupSize"
                        value={formData.groupSize}
                        onChange={handleChange}
                        placeholder="4명"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="travelDate">여행 예정일</Label>
                    <Input
                      id="travelDate"
                      name="travelDate"
                      type="date"
                      value={formData.travelDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">문의 내용 *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="궁금한 점이나 특별한 요청사항을 자유롭게 적어주세요."
                      rows={6}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideContact;
