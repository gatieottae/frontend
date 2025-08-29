
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Users, MessageCircle } from "lucide-react";

interface TravelGroupCardProps {
  id: string;
  title: string;
  destination: string;
  status: "upcoming" | "ongoing" | "completed";
  memberCount: number;
  dateRange: string;
  lastMessage?: string;
  unreadCount?: number;
  members: Array<{ name: string; avatar?: string }>;
  startDate: string; // 여행 시작 날짜 추가
  endDate: string; // 여행 종료 날짜 추가
}

const getDDayInfo = (startDate: string, endDate: string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) {
    // 여행 전
    const timeDiff = start.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return {
      label: `D-${daysDiff}`,
      color: "bg-blue-500"
    };
  } else if (now >= start && now <= end) {
    // 여행 중
    return {
      label: "여행 중",
      color: "bg-green-500"
    };
  } else {
    // 여행 종료
    return {
      label: "여행 종료",
      color: "bg-gray-500"
    };
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
  members,
  startDate,
  endDate
}: TravelGroupCardProps) => {
  const ddayInfo = getDDayInfo(startDate, endDate);

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
            <Badge className={`${ddayInfo.color} text-white`}>
              {ddayInfo.label}
            </Badge>
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
