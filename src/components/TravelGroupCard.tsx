
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Users, MessageCircle } from "lucide-react";

interface TravelGroupCardProps {
  id: string;
  title: string;
  destination: string;
  status: "planning" | "voting" | "confirmed" | "completed";
  memberCount: number;
  dateRange: string;
  lastMessage?: string;
  unreadCount?: number;
  members: Array<{ name: string; avatar?: string }>;
}

// D-day 계산 함수
const calculateDDay = (dateRange: string) => {
  // "3월 15일 - 18일" 형식에서 시작일 추출
  const startDateMatch = dateRange.match(/(\d+)월\s*(\d+)일/);
  if (!startDateMatch) return null;
  
  const month = parseInt(startDateMatch[1]);
  const day = parseInt(startDateMatch[2]);
  const currentYear = new Date().getFullYear();
  
  // 올해 날짜로 계산 (실제로는 년도도 받아야 함)
  const travelStartDate = new Date(currentYear, month - 1, day);
  const endDateMatch = dateRange.match(/(\d+)일$/);
  const endDay = endDateMatch ? parseInt(endDateMatch[1]) : day;
  const travelEndDate = new Date(currentYear, month - 1, endDay);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = travelStartDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `D-${diffDays}`;
  } else if (diffDays === 0 || (today >= travelStartDate && today <= travelEndDate)) {
    return "여행 중";
  } else {
    const endDiffTime = today.getTime() - travelEndDate.getTime();
    const endDiffDays = Math.ceil(endDiffTime / (1000 * 60 * 60 * 24));
    return `D+${endDiffDays}`;
  }
};

const TravelGroupCard = ({
  id,
  title,
  destination,
  status,
  memberCount,
  dateRange,
  lastMessage,
  unreadCount,
  members
}: TravelGroupCardProps) => {
  const dDay = calculateDDay(dateRange);

  return (
    <Link to={`/group/${id}`}>
      <Card className="card-hover cursor-pointer animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-none">{title}</h3>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {destination}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {status === "voting" && (
                <Badge className="bg-orange-500 text-white">
                  투표 중
                </Badge>
              )}
              {dDay && (
                <Badge variant="outline" className="border-primary text-primary">
                  {dDay}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {dateRange}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {memberCount}명
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {members.slice(0, 4).map((member, index) => (
                <Avatar key={index} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{members.length - 4}
                </div>
              )}
            </div>
            
            {lastMessage && (
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate max-w-20">
                  {lastMessage}
                </span>
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default TravelGroupCard;
