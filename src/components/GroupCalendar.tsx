
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalendarIcon, Clock, Users, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupCalendarProps {
  groupId: string;
}

// 임시 일정 데이터
const mockSchedules = [
  {
    id: "1",
    title: "제주도 도착",
    date: new Date(2025, 2, 15), // 3월 15일
    time: "10:00",
    type: "arrival",
    availableMembers: ["김민수", "이지은"],
    allMembers: ["김민수", "이지은", "박정우", "최유리"]
  },
  {
    id: "2", 
    title: "성산일출봉 관광",
    date: new Date(2025, 2, 16), // 3월 16일
    time: "06:00",
    type: "activity",
    availableMembers: ["김민수", "박정우", "최유리"],
    allMembers: ["김민수", "이지은", "박정우", "최유리"]
  }
];

const GroupCalendar = ({ groupId }: GroupCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState(mockSchedules);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    time: "",
    type: "activity"
  });
  const { toast } = useToast();

  const handleAddSchedule = () => {
    if (selectedDate && newSchedule.title && newSchedule.time) {
      const schedule = {
        id: Date.now().toString(),
        title: newSchedule.title,
        date: selectedDate,
        time: newSchedule.time,
        type: newSchedule.type,
        availableMembers: ["김민수"], // 현재 사용자
        allMembers: ["김민수", "이지은", "박정우", "최유리"]
      };
      setSchedules([...schedules, schedule]);
      setNewSchedule({ title: "", time: "", type: "activity" });
      setIsAddingSchedule(false);
      
      toast({
        title: "일정 추가 완료",
        description: "새로운 일정이 추가되었습니다.",
      });
    }
  };

  const handleJoinSchedule = (scheduleId: string) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const isAlreadyJoined = schedule.availableMembers.includes("김민수");
        
        if (isAlreadyJoined) {
          return {
            ...schedule,
            availableMembers: schedule.availableMembers.filter(member => member !== "김민수")
          };
        } else {
          return {
            ...schedule,
            availableMembers: [...schedule.availableMembers, "김민수"]
          };
        }
      }
      return schedule;
    }));

    const schedule = schedules.find(s => s.id === scheduleId);
    const isJoining = !schedule?.availableMembers.includes("김민수");
    
    toast({
      title: isJoining ? "일정 참여" : "일정 참여 취소",
      description: isJoining ? "일정에 참여하였습니다." : "일정 참여를 취소하였습니다.",
    });
  };

  const selectedDateSchedules = schedules.filter(
    schedule => selectedDate && 
    schedule.date.toDateString() === selectedDate.toDateString()
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "arrival": return "bg-green-500";
      case "activity": return "bg-blue-500";
      case "departure": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 캘린더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span className="text-foreground">일정 캘린더</span>
            </span>
            <Dialog open={isAddingSchedule} onOpenChange={setIsAddingSchedule}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  일정 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 일정 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">일정 제목</Label>
                    <Input
                      id="title"
                      value={newSchedule.title}
                      onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                      placeholder="일정 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">시간</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleAddSchedule} className="flex-1">
                      추가
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingSchedule(false)} className="flex-1">
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* 선택된 날짜의 일정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span className="text-foreground">
              {selectedDate 
                ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
                : "날짜를 선택하세요"
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateSchedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              선택된 날짜에 일정이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedDateSchedules.map((schedule) => {
                const isJoined = schedule.availableMembers.includes("김민수");
                const participationRate = (schedule.availableMembers.length / schedule.allMembers.length) * 100;
                
                return (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-foreground">{schedule.title}</h3>
                      <Badge className={`${getTypeColor(schedule.type)} text-white`}>
                        {schedule.time}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{schedule.availableMembers.length}/{schedule.allMembers.length} 참여</span>
                        <span>({participationRate.toFixed(0)}%)</span>
                      </div>
                      
                      <Button
                        variant={isJoined ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleJoinSchedule(schedule.id)}
                        className="flex items-center space-x-1"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>{isJoined ? "참여 취소" : "참여하기"}</span>
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      참여자: {schedule.availableMembers.join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupCalendar;
