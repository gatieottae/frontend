import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type GroupForm = {
  name: string;
  destination: string;
  startDate: string;   // yyyy-MM-dd
  endDate: string;     // yyyy-MM-dd
  description: string;
};

type Props = {
  /** 생성 성공 후 콜백 (리스트 리프레시 등) */
  onSuccess?: (groupId: number) => void;
  /** 버튼 라벨/트리거를 외부에서 커스터마이즈 하고 싶으면 children 사용 */
  trigger?: React.ReactNode;
};

/**
 * ✅ 생성 전용 다이얼로그
 * - 수정은 별도의 페이지에서 처리합니다.
 */
export default function CreateGroupDialog({ onSuccess, trigger }: Props) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<GroupForm>({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const invalidMsg = useMemo(() => {
    if (!form.name.trim()) return "그룹명은 필수입니다.";
    if (!form.destination.trim()) return "여행지는 필수입니다.";
    if (!form.startDate) return "여행 시작일을 선택해주세요.";
    if (!form.endDate) return "여행 종료일을 선택해주세요.";
    if (form.endDate < form.startDate) return "종료일은 시작일 이후여야 합니다.";
    return null;
  }, [form]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (invalidMsg) {
      setError(invalidMsg);
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken(); // TODO: 실제 토큰 획득 로직 연결
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`/api/groups`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: form.name,
          destination: form.destination,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.message || data?.error || `요청 실패 (${res.status})`);
      }

      const data = await safeJson(res);
      const groupId = data?.id;

      toast({
        title: "그룹 생성 완료",
        description: `"${form.name}" 그룹이 만들어졌습니다.`,
      });

      onSuccess?.(groupId);
      setOpen(false);
      // 폼 초기화
      setForm({
        name: "",
        destination: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    } catch (err: any) {
      setError(err.message || "알 수 없는 오류가 발생했어요.");
      toast({
        variant: "destructive",
        title: "그룹 생성 실패",
        description: err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setError(null); }}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="btn-gradient">새 여행 그룹</Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>새로운 여행 그룹 만들기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">그룹명</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="제주도 힐링 여행"
              required
            />
          </div>

          <div>
            <Label htmlFor="destination">여행지</Label>
            <Input
              id="destination"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="제주도"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">여행 시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">여행 종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">소개</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="이번 여행에 대한 간단한 설명을 적어주세요"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "저장 중..." : "그룹 만들기"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** 애플리케이션의 인증 스토리지에 맞춰 구현해주세요. */
function getAccessToken(): string | null {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}