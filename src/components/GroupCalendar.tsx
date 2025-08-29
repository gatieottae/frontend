import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalendarIcon, Clock, Users } from "lucide-react";

interface GroupCalendarProps {
  groupId: string;
}

interface Schedule {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: string;
  availableMembers: string[];
  allMembers: string[];
}

// 임시 일정 데이터
const mockSchedules: Schedule[] = [
  {
    id: "1",
    title: "제주도 도착",
    date: new Date(2025, 2, 15), // 3월 15일
    startTime: "10:00",
    endTime: "11:00",
    type: "arrival",
    availableMembers: ["김민수", "이지은"],
    allMembers: ["김민수", "이지은", "박정우", "최유리"]
  },
  {
    id: "2",
    title: "성산일출봉 관광",
    date: new Date(2025, 2, 16), // 3월 16일
    startTime: "06:00",
    endTime: "08:00",
    type: "activity",
    availableMembers: ["김민수", "박정우", "최유리"],
    allMembers: ["김민수", "이지은", "박정우", "최유리"]
  }
];

const allGroupMembers = ["김민수", "이지은", "박정우", "최유리"];

const GroupCalendar = ({ groupId }: GroupCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    startTime: "",
    endTime: "",
    type: "activity"
  });

  const handleAddSchedule = () => {
    if (selectedDate && newSchedule.title && newSchedule.startTime && newSchedule.endTime) {
      const schedule: Schedule = {
        id: Date.now().toString(),
        title: newSchedule.title,
        date: selectedDate,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        type: newSchedule.type,
        availableMembers: ["김민수"], // 현재 사용자
        allMembers: allGroupMembers
      };
      setSchedules([...schedules, schedule]);
      setNewSchedule({ title: "", startTime: "", endTime: "", type: "activity" });
      setIsAddingSchedule(false);
    }
  };

  const toggleParticipation = (scheduleId: string) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        const isParticipating = schedule.availableMembers.includes("김민수");
        return {
          ...schedule,
          availableMembers: isParticipating
            ? schedule.availableMembers.filter(member => member !== "김민수")
            : [...schedule.availableMembers, "김민수"]
        };
      }
      return schedule;
    }));
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
      <div>
        <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>일정 캘린더</span>
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
                      onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                      placeholder="일정 제목을 입력하세요"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">시작 시간</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newSchedule.startTime}
                        onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">종료 시간</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newSchedule.endTime}
                        onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleAddSchedule} className="flex-1">추가</Button>
                    <Button variant="outline" onClick={() => setIsAddingSchedule(false)} className="flex-1">취소</Button>
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
            classNames={{
              cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100",
              head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem]",
            }}
          />
        </CardContent>
        </Card>
      </div>

      {/* 선택된 날짜의 일정 */}
      <div>
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>
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
                const isParticipating = schedule.availableMembers.includes("김민수");
                const participantCount = schedule.availableMembers.length;
                const totalCount = schedule.allMembers.length;

                return (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{schedule.title}</h3>
                      <Badge className={`${getTypeColor(schedule.type)} text-white`}>
                        {schedule.startTime} - {schedule.endTime}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{participantCount}/{totalCount} 참여</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`participate-${schedule.id}`}
                          checked={isParticipating}
                          onCheckedChange={() => toggleParticipation(schedule.id)}
                        />
                        <Label
                          htmlFor={`participate-${schedule.id}`}
                          className="text-sm cursor-pointer"
                        >
                          참여하기
                        </Label>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      참여자: {schedule.availableMembers.join(", ") || "없음"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupCalendar;
