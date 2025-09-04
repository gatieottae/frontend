
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Users, MessageCircle } from "lucide-react";

interface TravelGroupCardProps {
  id: string;
  title: string;
  destination: string;
  memberCount: number;
  dateRange: string;
  lastMessage?: string;
  unreadCount?: number;
  members: Array<{ name: string; avatar?: string }>;
}

const getDdayInfo = (dateRange: string) => {
  if (!dateRange) return { label: "미정", color: "bg-gray-500" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [startDateStr, endDateStr] = dateRange.split(' ~ ');
  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = endDateStr ? new Date(endDateStr) : startDate;
  endDate.setHours(23, 59, 59, 999);

  const diffTime = startDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (today >= startDate && today <= endDate) {
    return { label: "여행 중", color: "bg-green-500" };
  } else if (today > endDate) {
    return { label: "여행 종료", color: "bg-gray-500" };
  } else {
    return { label: `D-${diffDays}`, color: "bg-blue-500" };
  }
};


const TravelGroupCard = ({
  id,
  title,
  destination,
  memberCount,
  dateRange,
  lastMessage,
  unreadCount,
  members
}: TravelGroupCardProps) => {
  const ddayInfo = getDdayInfo(dateRange);

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
