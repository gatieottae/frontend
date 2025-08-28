
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupChatProps {
  groupId: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isMe: boolean;
}

// 임시 채팅 데이터
const mockMessages: Message[] = [
  {
    id: "1",
    sender: "이지은",
    content: "제주도 여행 정말 기대돼요! 🌴",
    timestamp: new Date(2025, 2, 1, 10, 30),
    isMe: false
  },
  {
    id: "2",
    sender: "김민수",
    content: "저도요! 숙소 투표 확인해주세요~",
    timestamp: new Date(2025, 2, 1, 10, 32),
    isMe: true
  },
  {
    id: "3",
    sender: "박정우",
    content: "오션뷰 펜션에 투표했어요!",
    timestamp: new Date(2025, 2, 1, 10, 35),
    isMe: false
  },
  {
    id: "4",
    sender: "최유리",
    content: "날씨 예보 봤는데 좋을 것 같아요 ☀️",
    timestamp: new Date(2025, 2, 1, 11, 20),
    isMe: false
  }
];

const GroupChat = ({ groupId }: GroupChatProps) => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 스크롤 위치 자동 조정 방지
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 5;
      
      if (!isAtBottom) {
        // 사용자가 스크롤을 위로 올렸을 때는 자동 스크롤하지 않음
        return;
      }
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: "김민수", // 현재 사용자
        content: newMessage.trim(),
        timestamp: new Date(),
        isMe: true
      };
      setMessages([...messages, message]);
      setNewMessage("");
      
      // 알림 기능 시뮬레이션
      if (notificationsEnabled) {
        setTimeout(() => {
          toast({
            title: "새 메시지",
            description: `${message.sender}: ${message.content}`,
          });
        }, 100);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast({
      title: notificationsEnabled ? "알림 끄기" : "알림 켜기",
      description: notificationsEnabled ? "채팅 알림이 비활성화되었습니다." : "채팅 알림이 활성화되었습니다.",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return "오늘";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "어제";
    }
    
    return messageDate.toLocaleDateString("ko-KR", { 
      month: "long", 
      day: "numeric" 
    });
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span className="text-foreground">그룹 채팅</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotifications}
            className={notificationsEnabled ? "text-primary" : "text-muted-foreground"}
          >
            <Bell className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* 메시지 목록 */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onScroll={handleScroll}
        >
          {messages.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
            
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    {formatDate(message.timestamp)}
                  </div>
                )}
                
                <div className={`flex items-start space-x-2 ${
                  message.isMe ? "flex-row-reverse space-x-reverse" : ""
                }`}>
                  {!message.isMe && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {message.sender.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-xs lg:max-w-md ${
                    message.isMe ? "text-right" : ""
                  }`}>
                    {!message.isMe && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {message.sender}
                      </div>
                    )}
                    
                    <div className={`rounded-lg px-3 py-2 ${
                      message.isMe 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted text-foreground"
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 메시지 입력 */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupChat;
