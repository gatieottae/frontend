
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Users, MessageCircle } from "lucide-react";

interface TravelGroup {
  id: string;
  title: string;
  destination: string;
  dateRange: string;
  currentMembers: number;
  maxMembers: number;
  status: "recruiting" | "confirmed" | "planning" | "voting" | "completed";
  tags: string[];
  description: string;
}

interface TravelGroupCardProps {
  group: TravelGroup;
}

const statusConfig = {
  planning: { label: "계획 중", color: "bg-blue-500" },
  voting: { label: "투표 중", color: "bg-orange-500" },
  recruiting: { label: "모집 중", color: "bg-green-500" },
  confirmed: { label: "확정됨", color: "bg-green-600" },
  completed: { label: "완료", color: "bg-gray-500" }
};

const TravelGroupCard = ({ group }: TravelGroupCardProps) => {
  const statusInfo = statusConfig[group.status];

  // Mock members for display
  const mockMembers = Array.from({ length: group.currentMembers }, (_, i) => ({
    name: `멤버${i + 1}`,
    avatar: ""
  }));

  return (
    <Link to={`/group/${group.id}`}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-none text-foreground">{group.title}</h3>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {group.destination}
              </div>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {group.dateRange}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {group.currentMembers}/{group.maxMembers}명
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {mockMembers.slice(0, 4).map((member, index) => (
                <Avatar key={index} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {mockMembers.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{mockMembers.length - 4}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {group.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default TravelGroupCard;
