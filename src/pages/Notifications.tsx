
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, Calendar, Users, CreditCard, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  type: 'vote' | 'schedule' | 'payment' | 'message' | 'general';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  groupName?: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'vote',
      title: '투표 마감 임박',
      message: '제주도 여행 숙소 투표가 2시간 후 마감됩니다.',
      timestamp: '2시간 전',
      isRead: false,
      groupName: '제주도 여행'
    },
    {
      id: '2',
      type: 'schedule',
      title: '일정 확정',
      message: '부산 여행 일정이 확정되었습니다. 4월 15-17일',
      timestamp: '4시간 전',
      isRead: false,
      groupName: '부산 여행'
    },
    {
      id: '3',
      type: 'payment',
      title: '결제 요청',
      message: '숙박비 1/n 결제를 완료해주세요. (45,000원)',
      timestamp: '1일 전',
      isRead: true,
      groupName: '제주도 여행'
    },
    {
      id: '4',
      type: 'message',
      title: '새 메시지',
      message: '김민수님이 그룹 채팅에 메시지를 보냈습니다.',
      timestamp: '2일 전',
      isRead: true,
      groupName: '부산 여행'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vote': return <Users className="h-4 w-4" />;
      case 'schedule': return <Calendar className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vote': return 'bg-blue-500';
      case 'schedule': return 'bg-green-500';
      case 'payment': return 'bg-orange-500';
      case 'message': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">알림</h1>
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              모두 읽음 처리
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">새로운 알림이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !notification.isRead ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full text-white ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium text-foreground">
                          {notification.title}
                        </CardTitle>
                        {notification.groupName && (
                          <CardDescription className="text-xs">
                            {notification.groupName}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {notification.timestamp}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
