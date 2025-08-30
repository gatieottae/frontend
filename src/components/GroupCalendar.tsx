import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalendarIcon, Clock, Users, Pencil, Trash2 } from "lucide-react";

interface GroupCalendarProps {
  groupId: string;
}

type ScheduleType = "arrival" | "activity" | "departure";

interface Schedule {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: ScheduleType | string;
  availableMembers: string[];
  allMembers: string[];
}

interface RecommendedSchedule {
  title: string;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  source: "popular" | "recent" | "ai";
  score?: number;
}

// ---- Mock 데이터 ----
const mockSchedules: Schedule[] = [
  {
    id: "1",
    title: "제주도 도착",
    date: new Date(2025, 2, 15),
    startTime: "10:00",
    endTime: "11:00",
    type: "arrival",
    availableMembers: ["김민수", "이지은"],
    allMembers: ["김민수", "이지은", "박정우", "최유리"]
  },
  {
    id: "2",
    title: "성산일출봉 관광",
    date: new Date(2025, 2, 16),
    startTime: "06:00",
    endTime: "08:00",
    type: "activity",
    availableMembers: ["김민수", "박정우", "최유리"],
    allMembers: ["김민수", "이지은", "박정우", "최유리"]
  }
];

const allGroupMembers = ["김민수", "이지은", "박정우", "최유리"];

// 유틸: Date → yyyy-MM-dd
const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
// 유틸: yyyy-MM-dd → Date
const fromYmd = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const GroupCalendar = ({ groupId }: GroupCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  // 신규 일정 폼
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    startTime: "",
    endTime: "",
    type: "activity" as ScheduleType | string
  });

  // 추천(자동완성)
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoShown, setRecoShown] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedSchedule[]>([]);

  // 편집/삭제 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "activity" as ScheduleType | string
  });

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setEditForm({
      title: s.title,
      date: toYmd(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
      type: s.type
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!editForm.title || !editForm.date || !editForm.startTime || !editForm.endTime) return;

    setSchedules(prev =>
        prev.map(s =>
            s.id === editing.id
                ? {
                  ...s,
                  title: editForm.title,
                  date: fromYmd(editForm.date),
                  startTime: editForm.startTime,
                  endTime: editForm.endTime,
                  type: editForm.type
                }
                : s
        )
    );
    setEditOpen(false);
    setEditing(null);
  };

  const deleteSchedule = (id: string) => {
    if (!confirm("이 일정을 삭제할까요?")) return;
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  // 추가
  const handleAddSchedule = () => {
    if (selectedDate && newSchedule.title && newSchedule.startTime && newSchedule.endTime) {
      const schedule: Schedule = {
        id: Date.now().toString(),
        title: newSchedule.title,
        date: selectedDate,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        type: newSchedule.type,
        availableMembers: ["김민수"],
        allMembers: allGroupMembers
      };
      setSchedules(prev => [...prev, schedule]);
      setNewSchedule({ title: "", startTime: "", endTime: "", type: "activity" });
      setRecommendations([]);
      setRecoShown(false);
      setIsAddingSchedule(false);
    }
  };

  const toggleParticipation = (scheduleId: string) => {
    setSchedules(prev =>
        prev.map(schedule => {
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
        })
    );
  };

  const selectedDateSchedules = schedules.filter(
      schedule => selectedDate && schedule.date.toDateString() === selectedDate.toDateString()
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "arrival":
        return "bg-green-500";
      case "activity":
        return "bg-blue-500";
      case "departure":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // (Mock) 추천 가져오기
  const fetchRecommendations = async () => {
    setRecoLoading(true);
    try {
      const demo: RecommendedSchedule[] = [
        { title: "성산일출봉 일출", startTime: "05:40", endTime: "07:30", type: "activity", source: "popular", score: 0.92 },
        { title: "섭지코지 산책", startTime: "08:30", endTime: "09:30", type: "activity", source: "popular", score: 0.86 },
        { title: "우도 일주 드라이브", startTime: "10:00", endTime: "12:00", type: "activity", source: "popular", score: 0.88 },
        { title: "제주민속촌 관람", startTime: "13:30", endTime: "15:00", type: "activity", source: "recent", score: 0.81 },
        { title: "애월 카페 투어", startTime: "15:30", endTime: "17:30", type: "activity", source: "popular", score: 0.9 },
        { title: "숙소 체크인", startTime: "16:00", endTime: "16:30", type: "arrival", source: "recent", score: 0.81 }
      ];
      setRecommendations(demo);
      setRecoShown(true);
    } finally {
      setRecoLoading(false);
    }
  };

  // (지역별 그룹핑 제거됨)

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
                <Dialog
                    open={isAddingSchedule}
                    onOpenChange={(o) => {
                      setIsAddingSchedule(o);
                      if (!o) {
                        setRecommendations([]);
                        setRecoShown(false);
                        setRecoLoading(false);
                      }
                    }}
                >
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
                      {/* 기본 입력 */}
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

                      {/* 자동 완성 */}
                      <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={fetchRecommendations}
                          disabled={recoLoading}
                      >
                        {recoLoading ? "추천 불러오는 중..." : "✨ 자동 완성 (추천 일정 불러오기)"}
                      </Button>

                      {/* 추천 목록 (스크롤) */}
                      {recoShown && (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {recommendations.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-md border p-3">
                              <div>
                                <div className="font-medium">{r.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {r.startTime} - {r.endTime} • {r.type === "activity" ? "활동" : r.type === "arrival" ? "도착" : "출발"}
                                  {typeof r.score === "number" ? ` • 유사도 ${(r.score * 100).toFixed(0)}%` : ""}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  setNewSchedule({
                                    title: r.title,
                                    startTime: r.startTime,
                                    endTime: r.endTime,
                                    type: r.type
                                  })
                                }
                              >
                                적용
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

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
              <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{selectedDate ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정` : "날짜를 선택하세요"}</span>
              </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateSchedules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">선택된 날짜에 일정이 없습니다.</p>
              ) : (
                  <div className="space-y-4">
                    {selectedDateSchedules.map((schedule) => {
                      const isParticipating = schedule.availableMembers.includes("김민수");
                      const participantCount = schedule.availableMembers.length;
                      const totalCount = schedule.allMembers.length;

                      return (
                          <div key={schedule.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium">{schedule.title}</h3>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {toYmd(schedule.date)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getTypeColor(schedule.type)} text-white`}>
                                  {schedule.startTime} - {schedule.endTime}
                                </Badge>
                                <Button variant="ghost" size="icon" onClick={() => openEdit(schedule)} title="수정">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteSchedule(schedule.id)} title="삭제">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                                <Label htmlFor={`participate-${schedule.id}`} className="text-sm cursor-pointer">
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

        {/* ✏️ 일정 수정 다이얼로그 */}
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>일정 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">일정 제목</Label>
                <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-date">날짜</Label>
                <Input
                    id="edit-date"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start">시작 시간</Label>
                  <Input
                      id="edit-start"
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end">종료 시간</Label>
                  <Input
                      id="edit-end"
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>
              {/* 필요시 종류 선택 UI 추가 가능 */}
              {/* <div>
              <Label htmlFor="edit-type">종류</Label>
              <select
                id="edit-type"
                className="w-full p-2 border border-input rounded-md bg-background"
                value={editForm.type}
                onChange={(e) => setEditForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="activity">활동</option>
                <option value="arrival">도착</option>
                <option value="departure">출발</option>
              </select>
            </div> */}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={saveEdit}>저장</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>취소</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default GroupCalendar;