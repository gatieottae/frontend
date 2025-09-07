// src/components/GroupCalendar.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalendarIcon, Clock, Users, Pencil, Trash2 } from "lucide-react";
// ⬇️ put, del 실제로 사용
import { get, post, put, del } from "@/lib/http";
import { useToast } from "@/hooks/use-toast";

interface GroupCalendarProps {
  groupId: string;
}

/** ===== 서버 DTO ===== */
type ScheduleItemDto = {
  id: number;
  title: string;
  location?: string;
  startTime: string; // ISO-8601
  endTime: string;   // ISO-8601
  attending: {
    count: number; // 전체 참석 수
    sample: { memberId: number; displayName: string }[];
    hasMore: boolean;
    isMine: boolean; // 나의 참석 여부
  };
  overlap: boolean;
};

type CreateReqDto = {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO-8601
  endTime: string;   // ISO-8601
};

type UpdateReqDto = Partial<CreateReqDto>; // 부분 수정 허용

/** ===== 화면 모델 ===== */
type ScheduleType = "arrival" | "activity" | "departure";

interface Schedule {
  id: number;
  title: string;
  date: Date;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  type: ScheduleType | string;
  availableMembers: string[]; // 샘플 표시용
  totalAttendeeCount: number; // 전체 수
  isMine: boolean;            // 내가 현재 GOING인지
}

/** ===== 유틸 ===== */
// yyyy-MM-dd
const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// 명시적 오프셋으로 ISO 만들기 (타임존 흔들림 방지)
const toIsoWithOffset = (y: number, m0: number, d: number, hh = 0, mm = 0, ss = 0, ms = 0) => {
  const local = new Date(y, m0, d, hh, mm, ss, ms);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const tzMin = -local.getTimezoneOffset(); // KST면 -540 → +09:00
  const sign = tzMin >= 0 ? "+" : "-";
  const abs = Math.abs(tzMin);
  const offH = Math.trunc(abs / 60);
  const offM = abs % 60;
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}${sign}${pad(offH)}:${pad(offM)}`;
};
const startOfDayISO = (d: Date) => toIsoWithOffset(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDayISO = (d: Date) => toIsoWithOffset(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const toLocalDateAndTime = (iso: string) => {
  const dt = new Date(iso);
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return {
    date: new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()),
    time: `${hh}:${mm}`,
  };
};

const mapDtoToSchedule = (dto: ScheduleItemDto): Schedule => {
  const s = toLocalDateAndTime(dto.startTime);
  const e = toLocalDateAndTime(dto.endTime);
  return {
    id: dto.id,
    title: dto.title,
    date: s.date,
    startTime: s.time,
    endTime: e.time,
    type: "activity",
    availableMembers: dto.attending.sample.map(m => m.displayName),
    totalAttendeeCount: dto.attending.count,
    isMine: dto.attending.isMine,
  };
};

/** ===== API ===== */
async function apiList(groupId: string, fromIso: string, toIso: string) {
  return get<ScheduleItemDto[]>(`/groups/${groupId}/schedules`, { from: fromIso, to: toIso });
}
async function apiCreate(groupId: string, body: CreateReqDto) {
  return post<{ id: number; overlappedIds: number[] }>(`/groups/${groupId}/schedules`, body);
}
async function apiUpdate(groupId: string, scheduleId: number, body: UpdateReqDto) {
  return put<{ id: number; overlappedIds: number[] }>(`/groups/${groupId}/schedules/${scheduleId}`, body);
}
async function apiDelete(groupId: string, scheduleId: number) {
  return del<void>(`/groups/${groupId}/schedules/${scheduleId}`);
}
async function apiAttendance(scheduleId: number, status: "GOING" | "NOT_GOING" | "TENTATIVE") {
  return put<void>(`/schedules/${scheduleId}/attendance`, { status });
}

/** ===== 컴포넌트 ===== */
const GroupCalendar = ({ groupId }: GroupCalendarProps) => {
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  // 신규 일정 폼
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    startTime: "",
    endTime: "",
    type: "activity" as ScheduleType | string,
  });

  // 수정 다이얼로그
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    // location/description을 폼에 넣고 싶다면 여기에 필드 추가
  });

  // 선택 날짜의 하루 범위 조회
  const reloadDay = async (day: Date) => {
    const list = await apiList(groupId, startOfDayISO(day), endOfDayISO(day));
    setSchedules(list.map(mapDtoToSchedule));
  };

  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      try {
        await reloadDay(selectedDate);
      } catch (e) {
        console.error(e);
        toast({
          title: "일정 조회 실패",
          description: "일정을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        setSchedules([]);
      }
    })();
  }, [groupId, selectedDate, toast]);

  // 신규 생성
  const handleAddSchedule = async () => {
    if (!selectedDate) return;
    if (!(newSchedule.title && newSchedule.startTime && newSchedule.endTime)) {
      toast({ title: "입력을 확인해주세요", description: "제목/시간은 필수입니다.", variant: "destructive" });
      return;
    }

    const [sh, sm] = newSchedule.startTime.split(":").map(Number);
    const [eh, em] = newSchedule.endTime.split(":").map(Number);
    const startIso = toIsoWithOffset(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), sh, sm ?? 0, 0, 0);
    const endIso   = toIsoWithOffset(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), eh, em ?? 0, 0, 0);

    try {
      await apiCreate(groupId, { title: newSchedule.title.trim(), startTime: startIso, endTime: endIso });
      await reloadDay(selectedDate);
      setNewSchedule({ title: "", startTime: "", endTime: "", type: "activity" });
      setIsAddingSchedule(false);
      toast({ title: "일정이 추가되었습니다." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "일정 추가 실패",
        description: typeof e?.message === "string" ? e.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 수정 다이얼로그 열기
  const openEdit = (s: Schedule) => {
    setEditing(s);
    setEditForm({
      title: s.title,
      date: toYmd(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
    });
    setEditOpen(true);
  };

  // 수정 저장 → PUT
  const handleSaveEdit = async () => {
    if (!editing || !selectedDate) return;

    // 보낸 필드만 갱신되게 구성 (부분수정)
    const body: UpdateReqDto = {};
    if (editForm.title && editForm.title !== editing.title) body.title = editForm.title.trim();

    // 날짜/시간이 바뀌었으면 ISO 재조합
    if (editForm.date && editForm.startTime) {
      const d = new Date(editForm.date);
      const [sh, sm] = editForm.startTime.split(":").map(Number);
      body.startTime = toIsoWithOffset(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm ?? 0, 0, 0);
    }
    if (editForm.date && editForm.endTime) {
      const d = new Date(editForm.date);
      const [eh, em] = editForm.endTime.split(":").map(Number);
      body.endTime = toIsoWithOffset(d.getFullYear(), d.getMonth(), d.getDate(), eh, em ?? 0, 0, 0);
    }

    try {
      await apiUpdate(groupId, editing.id, body);
      await reloadDay(new Date(editForm.date || editing.date));
      setEditOpen(false);
      setEditing(null);
      toast({ title: "일정이 수정되었습니다." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "일정 수정 실패",
        description: typeof e?.message === "string" ? e.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 삭제 → DELETE
  const handleDelete = async (id: number) => {
    if (!selectedDate) return;
    if (!confirm("이 일정을 삭제할까요?")) return;
    try {
      await apiDelete(groupId, id);
      await reloadDay(selectedDate);
      toast({ title: "일정이 삭제되었습니다." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "일정 삭제 실패",
        description: typeof e?.message === "string" ? e.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 참여 토글 → PUT /attendance
  const toggleParticipation = async (schedule: Schedule) => {
    if (!selectedDate) return;
    const next = schedule.isMine ? "NOT_GOING" : "GOING" as const;
    try {
      await apiAttendance(schedule.id, next);
      await reloadDay(selectedDate);
      toast({ title: next === "GOING" ? "참여로 표시했습니다." : "참여 해제했습니다." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "참여 상태 변경 실패",
        description: typeof e?.message === "string" ? e.message : "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 선택일 카드 목록
  const selectedDateSchedules = useMemo(
      () => schedules.filter(s => selectedDate && s.date.toDateString() === selectedDate.toDateString()),
      [schedules, selectedDate]
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

                <Dialog
                    open={isAddingSchedule}
                    onOpenChange={(o) => {
                      setIsAddingSchedule(o);
                      if (!o) setNewSchedule({ title: "", startTime: "", endTime: "", type: "activity" });
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
                      const isParticipating = schedule.isMine;
                      const participantCount = schedule.totalAttendeeCount;

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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600"
                                    title="삭제"
                                    onClick={() => handleDelete(schedule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{participantCount}명 참여</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`participate-${schedule.id}`}
                                    checked={isParticipating}
                                    onCheckedChange={() => toggleParticipation(schedule)}
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

        {/* ✏️ 수정 다이얼로그 */}
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
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveEdit}>저장</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>취소</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default GroupCalendar;