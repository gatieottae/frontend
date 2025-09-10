// src/components/VotingSystem.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Vote as VoteIcon, Clock, CheckCircle, CalendarIcon, Link, X, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {get, post, patch, del} from "@/lib/http";
import { useToast } from "@/hooks/use-toast";

import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { StompSubscription } from "@stomp/stompjs";


/** =========================
 * 타입 정의
 * ========================= */
interface VotingSystemProps {
  groupId: string;
}

interface VoteOption {
  id: number;
  text: string;
  link?: string;
  thumbnail?: string;
  votes: number;
  voters: string[];
}

interface Vote {
  id: number;
  title: string;
  description?: string;
  category: string; // 한글 표시명
  status: "OPEN" | "CLOSED";
  closesAt?: string;
  options: VoteOption[];
  totalVoters: number;
  myVoteOptionId?: number;
}

/** =========================
 * 백엔드 DTO (컨트롤러 스펙)
 * ========================= */
type PollListItemDto = {
  id: number;
  title: string;
  description?: string;
  categoryCode: "ACCOM" | "FOOD" | "CAFE" | "ACTIVITY" | "TRANS" | "ETC";
  status: "OPEN" | "CLOSED";
  closesAt?: string;
  totalVoters: number;
  myVoteOptionId?: number | null;
  options: { id: number; content: string; votes: number }[]; // 목록에 득표 포함
};

type PollResultsResDto = {
  pollId: number;
  title: string;
  categoryCode: string;
  status: "OPEN" | "CLOSED";
  closesAt?: string;
  voted: boolean;
  options: { optionId: number; content: string; votes: number; isMine: boolean }[];
};

type PollCreateReqDto = {
  groupId: number;
  categoryCode: string;   // e.g. "FOOD"
  title: string;
  description?: string;
  closesAt?: string;      // ISO-8601
  options: string[];      // 문자열 배열
};

/** =========================
 * 실시간 업데이트(WS) 메시지 스펙
 *  - 백엔드에서 /topic/polls/{id}로 브로드캐스트하는 payload 형식과 동일
 *  - 여기서는 Results 응답과 같은 형태를 가정
 * ========================= */
type PollRealtimePayload = PollResultsResDto;

/** WebSocket/Stomp 엔드포인트 (백엔드 설정과 일치시킬 것)
 *  - 예: Backend `WebSocketConfig`의 `setApplicationDestinationPrefixes("/app")` 및
 *        `registry.addEndpoint("/ws").setAllowedOrigins("*") ...`
 *  - 프런트에서는 SockJS로 `/ws`에 연결하고, 구독은 `/topic/polls/{id}`
 */
const WS_ENDPOINT = (import.meta as any)?.env?.VITE_WS_ENDPOINT || "/ws";

/** =========================
 * 카테고리 맵핑
 * ========================= */
const categoryCodeToName = (code: string) =>
    ({
      ACCOM: "숙소",
      FOOD: "음식점",
      CAFE: "카페",
      ACTIVITY: "활동",
      TRANS: "교통",
      ETC: "기타",
    } as const)[code as keyof any] ?? "기타";

const categoryNameToCode = (name: string) => {
  const map: Record<string, string> = {
    숙소: "ACCOM",
    음식점: "FOOD",
    카페: "CAFE",
    활동: "ACTIVITY",
    교통: "TRANS",
    기타: "ETC",
  };
  return map[name] ?? "ETC";
};

const categories = [
  { value: "숙소", label: "숙소" },
  { value: "음식점", label: "음식점" },
  { value: "카페", label: "카페" },
  { value: "활동", label: "활동" },
  { value: "교통", label: "교통" },
  { value: "기타", label: "기타" },
];

const mapListToVotes = (list: PollListItemDto[]): Vote[] =>
    list.map((p) => {
      const options: VoteOption[] = (p.options ?? []).map((o) => ({
        id: o.id,
        text: o.content,
        votes: o.votes ?? 0,
        voters: [],
      }));
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: categoryCodeToName(p.categoryCode),
        status: p.status,
        closesAt: p.closesAt,
        options,
        totalVoters:
            typeof p.totalVoters === "number"
                ? p.totalVoters
                : options.reduce((a, c) => a + (c.votes ?? 0), 0),
        myVoteOptionId: p.myVoteOptionId ?? undefined,
      };
    });

/** =========================
 * 유틸: 마감일 → 로컬 23:59:59 ISO
 * ========================= */
function endOfDayISO(d: Date) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return local.toISOString();
}

/** =========================
 * API 래퍼 ( 경로로 통일)
 * ========================= */
async function apiListPolls(groupId: string) {
  return get<PollListItemDto[]>(`/polls?groupId=${groupId}`);
}

async function apiCreatePoll(body: PollCreateReqDto) {
  return post<{ id: number }>(`/polls`, body);
}

async function apiGetResults(pollId: number) {
  return get<PollResultsResDto>(`/polls/${pollId}/results`);
}

async function apiVote(pollId: number, optionId: number) {
  return post<void>(`/polls/${pollId}/vote`, { optionId });
}

async function apiClosePoll(pollId: number) {
  return patch(`/polls/${pollId}/close`, {});
}

async function apiUpdatePoll(pollId: number, body: {
  title?: string;
  description?: string;
  closesAt?: string;
  categoryCode?: string;
  options?: { id?: number; content: string; sortOrder?: number }[];
}) {
  return patch<void>(`/polls/${pollId}`, body);
}

async function apiDeletePoll(pollId: number) {
  return del<void>(`/polls/${pollId}`);
}

async function apiUnvote(pollId: number) {
  return del<void>(`/polls/${pollId}/vote`);
}

/** =========================
 * 컴포넌트
 * ========================= */
const VotingSystem = ({ groupId }: VotingSystemProps) => {
  const { toast } = useToast();

  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 클릭 연타로 인한 경합 방지
  const [pollBusy, setPollBusy] = useState<Record<number, boolean>>({});

  // 생성 다이얼로그
  const [isCreatingVote, setIsCreatingVote] = useState(false);
  const [newVote, setNewVote] = useState({
    title: "",
    description: "",
    category: "",
    endDate: undefined as Date | undefined,
    options: [
      { text: "", link: "" },
      { text: "", link: "" },
    ],
  });

  // ===== 수정 모달 상태 =====
  const [editingVote, setEditingVote] = useState<Vote | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    endDate: Date | undefined;
    category: string;
  }>({ title: "", description: "", endDate: undefined, category: "" });

  const openEditModal = (v: Vote) => {
    setEditingVote(v);
    setEditForm({
      title: v.title,
      description: v.description ?? "",
      endDate: v.closesAt ? new Date(v.closesAt) : undefined,
      category: v.category,
    });
  };

  const closeEditModal = () => {
    setEditingVote(null);
  };

  // ===== WebSocket / STOMP =====
  const stompRef = useRef<Client | null>(null);
  const subscribedIdsRef = useRef<Set<number>>(new Set()); // 현재 구독 중인 pollId 집합

  /** Poll ID를 받아 최신 득표 결과를 동기화 */
  const syncPollResults = async (pollId: number) => {
    try {
      const res = await apiGetResults(pollId);
      setVotes(prev =>
        prev.map(v => {
          if (v.id !== pollId) return v;
          const optVotes = new Map((res.options || []).map(o => [o.optionId, o.votes]));
          const newOptions = v.options.map(o => ({ ...o, votes: optVotes.get(o.id) ?? 0 }));
          const total = newOptions.reduce((a, c) => a + c.votes, 0);
          const my = (res.options || []).find(o => o.isMine)?.optionId ?? undefined;
          return { ...v, options: newOptions, totalVoters: total, myVoteOptionId: my };
        })
      );
    } catch (e) {
      console.error(`Failed to sync poll results for pollId: ${pollId}`, e);
    }
  };

  /** 서버가 push한 결과(payload)를 현재 화면 상태에 반영 */
  const applyRealtimeResults = (payload: PollRealtimePayload) => {
    if (payload && payload.pollId) {
      syncPollResults(payload.pollId);
    }
  };

  const subsByPollIdRef = useRef<Map<number, StompSubscription>>(new Map());

  /** =========================
   * STOMP 연결 수립 (마운트 시 1회)
   * ========================= */
  useEffect(() => {
    // 이미 연결되어 있으면 스킵
    if (stompRef.current) return;

    const client = new Client({
      // 웹소켓 팩토리: SockJS 사용 (브라우저 호환)
      webSocketFactory: () => new SockJS(WS_ENDPOINT) as any,
      reconnectDelay: 2000, // 자동 재연결(ms)
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // 디버그 로깅 (필요 시 주석 해제)
      // debug: (msg) => console.log("[STOMP]", msg),
      onConnect: () => {
        // 연결되면, 현재 보유한 투표 목록에 대해 구독을 보장한다.
        // 실제 구독은 아래 `syncSubscriptionsWithVotes()`에서 처리
        syncSubscriptionsWithVotes();
      },
      onStompError: (frame) => {
        // 서버에서 ERROR frame 수신
        // console.warn("[STOMP ERROR]", frame.headers["message"], frame.body);
      },
    });

    stompRef.current = client;
    client.activate();

    return () => {
      try {
        for (const [, sub] of subsByPollIdRef.current.entries()) {
          try { sub.unsubscribe(); } catch {}
        }
        subsByPollIdRef.current.clear();
      } finally {
        client.deactivate();
        stompRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 현재 votes 배열에 맞춰 구독/해제를 동기화 */
  const syncSubscriptionsWithVotes = () => {
    const client = stompRef.current;
    if (!client || !client.connected) return;

    const targetIds = new Set(votes.map((v) => v.id));

    // 1) 필요 없는 구독 해제
    for (const [pollId, sub] of subsByPollIdRef.current.entries()) {
      if (!targetIds.has(pollId)) {
        try { sub.unsubscribe(); } catch {}
        subsByPollIdRef.current.delete(pollId);
      }
    }

    // 2) 신규 구독 추가
    votes.forEach((v) => {
      if (subsByPollIdRef.current.has(v.id)) return;

      const dest = `/topic/polls/${v.id}`;
      const sub = client.subscribe(dest, (message: IMessage) => {
        try {
          const payload: PollRealtimePayload = JSON.parse(message.body);
          applyRealtimeResults(payload);
        } catch {/* ignore */}
      });

      subsByPollIdRef.current.set(v.id, sub);
    });
  };

  // votes 목록이 갱신되면 구독 상태도 동기화
  useEffect(() => {
    syncSubscriptionsWithVotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votes]);

  /** 목록 로딩 */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await apiListPolls(groupId);
        const mapped = mapListToVotes(list);
        setVotes(mapped);

        // 결과 동기화(선택): 각 투표의 득표 수 다시 맞추기
        await Promise.all(
            mapped.map(async (poll) => {
              try {
                const res = await apiGetResults(poll.id);
                setVotes((prev) =>
                    prev.map((v) => {
                      if (v.id !== poll.id) return v;
                      const optMap = new Map<number, number>();
                      // ✅ 객체 응답의 options 사용
                      res.options.forEach((r) => optMap.set(r.optionId, r.votes));
                      const newOptions = v.options.map((o) => ({
                        ...o,
                        votes: optMap.get(o.id) ?? 0,
                      }));
                      const total = newOptions.reduce((acc, cur) => acc + cur.votes, 0);
                      const my = res.options.find((o) => o.isMine)?.optionId;
                      return { ...v, options: newOptions, totalVoters: total, myVoteOptionId: my ?? v.myVoteOptionId };
                    })
                );
              } catch {
                /* ignore */
              }
            })
        );
      } catch (e: any) {
        toast({
          title: "투표 목록 조회 실패",
          description: e?.message || "목록을 불러오지 못했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        // 최초 로딩 직후, 현재 목록 기준으로 구독 동기화
        syncSubscriptionsWithVotes();
      }
    })();
  }, [groupId, toast]);

  /** 투표 생성 */
  const handleCreateVote = async () => {
    const valid =
        newVote.title.trim() &&
        newVote.category &&
        newVote.endDate &&
        newVote.options.filter((opt) => opt.text.trim()).length >= 2;

    if (!valid) {
      toast({
        title: "입력을 확인해주세요",
        description: "제목/카테고리/마감일/선택지 2개 이상이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    // 중복 옵션 검증
    const optionTexts = newVote.options
        .map((o) => o.text.trim().toLowerCase())
        .filter(Boolean);
    const hasDuplicate = new Set(optionTexts).size !== optionTexts.length;

    if (hasDuplicate) {
      toast({
        title: "중복된 선택지가 있습니다",
        description: "같은 이름의 선택지는 추가할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const body: PollCreateReqDto = {
        groupId: Number(groupId),
        categoryCode: categoryNameToCode(newVote.category),
        title: newVote.title.trim(),
        description: newVote.description?.trim() || undefined,
        closesAt: endOfDayISO(newVote.endDate!),
        options: newVote.options.map((o) => o.text.trim()).filter(Boolean), // ✅ 문자열 배열
      };

      const { id } = await apiCreatePoll(body);

      // 목록 재조회
      const list = await apiListPolls(groupId);
      const mapped: Vote[] = list.map((p) => {
        const options: VoteOption[] = p.options.map((o) => ({
          id: o.id,
          text: o.content,
          votes: o.votes ?? 0,
          voters: [],
        }));
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          category: categoryCodeToName(p.categoryCode),
          status: p.status,
          closesAt: p.closesAt,
          options,
          totalVoters:
              typeof p.totalVoters === "number"
                  ? p.totalVoters
                  : options.reduce((a, c) => a + (c.votes ?? 0), 0),
          myVoteOptionId: p.myVoteOptionId ?? undefined,
        };
      });
      setVotes(mapped);
      syncSubscriptionsWithVotes();

      // 생성 모달 리셋/닫기
      setNewVote({
        title: "",
        description: "",
        category: "",
        endDate: undefined,
        options: [
          { text: "", link: "" },
          { text: "", link: "" },
        ],
      });
      setIsCreatingVote(false);

      toast({ title: "투표가 생성되었습니다." });

      // 생성된 poll 결과 동기화(선택)
      try {
        const res = await apiGetResults(id);
        setVotes((prev) =>
            prev.map((v) => {
              if (v.id !== id) return v;
              const optVotes = new Map(res.options.map((o) => [o.optionId, o.votes]));
              const newOptions = v.options.map((o) => ({ ...o, votes: optVotes.get(o.id) ?? 0 }));
              const total = newOptions.reduce((a, c) => a + c.votes, 0);
              const my = res.options.find((o) => o.isMine)?.optionId ?? v.myVoteOptionId;
              return { ...v, options: newOptions, totalVoters: total, myVoteOptionId: my };
            })
        );
      } catch {
        /* no-op */
      }
    } catch (e: any) {
      toast({
        title: "투표 생성 실패",
        description: e?.message || "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  /** 투표하기 (토글 및 교체 동작) */
  const handleVote = async (pollId: number, optionId: number, isActive: boolean) => {
    if (!isActive) return;
    if (pollBusy[pollId]) return; // 이미 처리 중이면 무시

    // 현재 내가 고른 옵션
    const current = votes.find(v => v.id === pollId)?.myVoteOptionId;

    // 처리 중 플래그 ON
    setPollBusy(prev => ({ ...prev, [pollId]: true }));

    try {
      if (current === optionId) {
        // 같은 항목 다시 클릭 → 언투표(DELETE 엔드포인트 타기)
        await apiUnvote(pollId);

        // 낙관적: 내 선택 해제
        setVotes(prev =>
          prev.map(v => {
            if (v.id !== pollId) return v;
            const newOptions = v.options.map(o =>
              o.id === optionId ? { ...o, votes: Math.max(0, o.votes - 1) } : o
            );
            const total = newOptions.reduce((a, c) => a + c.votes, 0);
            return { ...v, options: newOptions, totalVoters: total, myVoteOptionId: undefined };
          })
        );

        toast({ title: "선택을 취소했어요." });
      } else {
        // 다른 항목 클릭 → 서버가 교체(upsert) 처리
        await apiVote(pollId, optionId);

        // 낙관적: 이전 -1, 새 +1, 내 선택 변경
        setVotes(prev =>
          prev.map(v => {
            if (v.id !== pollId) return v;
            const before = v.myVoteOptionId;
            const newOptions = v.options.map(o => {
              let nv = o.votes;
              if (before && o.id === before) nv = Math.max(0, nv - 1);
              if (o.id === optionId) nv = nv + 1;
              return { ...o, votes: nv };
            });
            const total = newOptions.reduce((a, c) => a + c.votes, 0);
            return { ...v, options: newOptions, totalVoters: total, myVoteOptionId: optionId };
          })
        );

        toast({ title: "투표가 반영되었습니다." });
      }

      // 서버 기준으로 최종 동기화
      await syncPollResults(pollId);
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status;
      if (Number(status) === 409) {
        toast({ title: "투표 불가", description: "마감되었거나 조건을 만족하지 않습니다.", variant: "destructive" });
      } else if (Number(status) === 403) {
        toast({ title: "권한 없음", description: "이 작업을 수행할 권한이 없습니다.", variant: "destructive" });
      } else {
        toast({ title: "요청 실패", description: e?.message || "요청 처리 중 오류가 발생했습니다.", variant: "destructive" });
      }
    } finally {
      // 처리 중 플래그 OFF
      setPollBusy(prev => {
        const next = { ...prev };
        delete next[pollId];
        return next;
      });
    }
  };

  /** 마감 */
  const handleClose = async (voteId: number) => {
    try {
      await apiClosePoll(voteId);
      setVotes((prev) => prev.map((v) => (v.id === voteId ? { ...v, status: "CLOSED" } : v)));
      toast({ title: "투표가 마감되었습니다." });
    } catch (e: any) {
      toast({
        title: "마감 실패",
        description: e?.message || "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  /** 투표 수정 */
  const handleSaveEdit = async (editing: Vote, formState: {
    title?: string; description?: string; endDate?: Date; category?: string;
    options?: { id?: number; text: string; sortOrder?: number }[];
  }) => {
    // 중복 옵션 방지(프론트)
    if (formState.options) {
      const texts = formState.options.map(o => o.text.trim().toLowerCase()).filter(Boolean);
      if (new Set(texts).size !== texts.length) {
        toast({ title: "중복된 선택지가 있습니다", variant: "destructive" }); return;
      }
    }

    const body: any = {};
    if (formState.title !== undefined) body.title = formState.title.trim();
    if (formState.description !== undefined) body.description = formState.description?.trim() || null;
    if (formState.endDate) body.closesAt = endOfDayISO(formState.endDate);
    if (formState.category) body.categoryCode = categoryNameToCode(formState.category);

    if (formState.options) {
      body.options = formState.options.map(o => ({
        id: o.id,
        content: o.text.trim(),
        sortOrder: o.sortOrder,
      }));
    }

    try {
      await apiUpdatePoll(editing.id, body);
      // 낙관적 갱신(간단하게 목록 새로고침 또는 해당 카드만 업데이트)
      const list = await apiListPolls(groupId);
      setVotes(mapListToVotes(list));  // ← 여기
      toast({ title: "수정되었습니다." });
    } catch (e: any) {
      toast({
        title: "수정 실패",
        description: e?.response?.data?.message || e?.message || "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  /** 투표 삭제 */
  const handleDelete = async (pollId: number) => {
    if (!confirm("정말 이 투표를 삭제하시겠어요? (투표가 있으면 삭제할 수 없습니다)")) return;
    try {
      await apiDeletePoll(pollId);
      setVotes(prev => prev.filter(v => v.id !== pollId));
      toast({ title: "삭제 완료" });
    } catch (e: any) {
      toast({
        title: "삭제 실패",
        description: e?.response?.data?.message || e?.message || "오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  /** 상태/카테고리 색상 */
  const getStatusColor = (status: "OPEN" | "CLOSED") => (status === "OPEN" ? "bg-green-500" : "bg-gray-500");
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "숙소":
        return "bg-blue-100 text-blue-800";
      case "음식점":
        return "bg-orange-100 text-orange-800";
      case "카페":
        return "bg-yellow-100 text-yellow-800";
      case "활동":
        return "bg-green-100 text-green-800";
      case "교통":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const isVoteExpired = (closesAt?: string) => {
    if (!closesAt) return false;
    return new Date(closesAt).getTime() < Date.now();
  };
  const canCreateVote = () =>
      Boolean(
          newVote.title.trim() &&
          newVote.category &&
          newVote.endDate &&
          newVote.options.filter((opt) => opt.text.trim()).length >= 2
      );

  const visibleVotes = useMemo(() => votes, [votes]);

  return (
      <div className="space-y-6">
        {/* 투표 목록 */}
        <div className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">불러오는 중…</p>}
          {!loading && visibleVotes.length === 0 && (
              <p className="text-sm text-muted-foreground">아직 등록된 투표가 없습니다.</p>
          )}

          {visibleVotes.map((vote) => {
            const expired = isVoteExpired(vote.closesAt);
            const isActive = vote.status === "OPEN" && !expired;
            const closesText = vote.closesAt ? format(new Date(vote.closesAt), "yyyy-MM-dd HH:mm") : "마감일 없음";
            return (
                <Card key={vote.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center space-x-2 mb-2">
                          <VoteIcon className="h-5 w-5" />
                          <span>{vote.title}</span>
                        </CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <Badge className={getCategoryColor(vote.category)}>{vote.category}</Badge>
                          <Badge className={`${getStatusColor(vote.status)} text-white`}>
                            {vote.status === "OPEN" ? "진행 중" : "종료됨"}
                          </Badge>
                          {expired && <Badge variant="destructive">마감됨</Badge>}
                        </div>
                        {vote.description && <p className="text-muted-foreground">{vote.description}</p>}
                      </div>
                      <div className="text-right min-w-[160px]">
                        <div className="flex items-center justify-end text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {closesText}
                        </div>
                        {/*{isActive ? (*/}
                        {/*    <div className="mt-2">*/}
                        {/*      <Button size="sm" variant="outline" onClick={() => handleClose(vote.id)}>*/}
                        {/*        <Lock className="h-4 w-4 mr-1" />*/}
                        {/*        마감*/}
                        {/*      </Button>*/}
                        {/*    </div>*/}
                        {/*) : null}*/}
                      </div>
                    </div>
                    {isActive && (
                        <div className="mt-2 flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(vote)}>
                            수정
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(vote.id)}>
                            삭제
                          </Button>
                        </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {vote.options.map((option) => {
                        const percentage = vote.totalVoters > 0 ? (option.votes / vote.totalVoters) * 100 : 0;
                        const isMy = vote.myVoteOptionId === option.id;
                        return (
                            <div
                                key={option.id}
                                className={cn(
                                    "border rounded-lg p-3 cursor-pointer transition-colors",
                                    isActive ? "hover:bg-muted/50" : "opacity-80 cursor-not-allowed",
                                    isMy && "border-primary bg-primary/5"
                                )}
                                onClick={() => !pollBusy[vote.id] && handleVote(vote.id, option.id, isActive)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{option.text}</span>
                                  {isMy && <CheckCircle className="h-4 w-4 text-primary" />}
                                  {option.link && <Link className="h-4 w-4 text-muted-foreground" />}
                                </div>
                                <span className="text-sm text-muted-foreground">
                            {option.votes}표{vote.totalVoters > 0 ? ` (${percentage.toFixed(0)}%)` : ""}
                          </span>
                              </div>
                              <Progress value={percentage} className="h-2 mb-2" />
                              {!!option.voters?.length && (
                                  <div className="text-xs text-muted-foreground">{option.voters.join(", ")}</div>
                              )}
                            </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
            );
          })}
        </div>

        {/* Floating Action Button: 투표 만들기 */}
        <div className="fixed bottom-6 right-6 z-50">
          <Dialog open={isCreatingVote} onOpenChange={setIsCreatingVote}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-lg bg-primary hover:bg-[rgb(35,100,50)] text-white px-6 py-3 text-base font-semibold">
                투표 만들기
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 투표 만들기</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* 입력 필드 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vote-title">투표 제목 *</Label>
                    <Input
                        id="vote-title"
                        value={newVote.title}
                        onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                        placeholder="투표 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vote-description">설명</Label>
                    <Textarea
                        id="vote-description"
                        value={newVote.description}
                        onChange={(e) => setNewVote({ ...newVote, description: e.target.value })}
                        placeholder="투표에 대한 설명을 입력하세요"
                        rows={3}
                    />
                  </div>
                  <div>
                    <Label>카테고리 *</Label>
                    <Select value={newVote.category} onValueChange={(value) => setNewVote({ ...newVote, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>마감일 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !newVote.endDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newVote.endDate ? format(newVote.endDate, "yyyy년 MM월 dd일") : "날짜를 선택하세요"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={newVote.endDate}
                            onSelect={(date) => setNewVote({ ...newVote, endDate: date ?? undefined })}
                            initialFocus
                            className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 선택지 영역 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>선택지 (최소 2개 필수)</Label>
                  </div>

                  <div className="space-y-3">
                    {newVote.options.map((option, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>선택지 {index + 1}</Label>
                              {newVote.options.length > 2 && (
                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const next = newVote.options.filter((_, i) => i !== index);
                                        setNewVote({ ...newVote, options: next });
                                      }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                              )}
                            </div>

                            <Input
                                value={option.text}
                                onChange={(e) => {
                                  const next = [...newVote.options];
                                  next[index] = { ...next[index], text: e.target.value };
                                  setNewVote({ ...newVote, options: next });
                                }}
                                placeholder="선택지 이름을 입력하세요"
                            />

                            <div className="flex items-center space-x-2">
                              <Link className="h-4 w-4" />
                              <Input
                                  value={(option as any).link ?? ""}
                                  onChange={(e) => {
                                    const next = [...newVote.options];
                                    next[index] = { ...next[index], link: e.target.value };
                                    setNewVote({ ...newVote, options: next });
                                  }}
                                  placeholder="링크 입력 (선택사항)"
                                  className="flex-1"
                              />
                            </div>
                          </div>
                        </Card>
                    ))}
                  </div>

                  <Button
                      variant="outline"
                      onClick={() => setNewVote({ ...newVote, options: [...newVote.options, { text: "", link: "" }] })}
                      className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    선택지 추가
                  </Button>
                </div>

                {/* 하단 액션 */}
                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleCreateVote} className="flex-1" disabled={!canCreateVote()}>
                    만들기
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingVote(false)} className="flex-1">
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      {/* ====== 수정 모달 ====== */}
      {editingVote && (
        <Dialog open={true} onOpenChange={(o) => !o && closeEditModal()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>투표 수정</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">제목</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="제목"
                />
              </div>

              <div>
                <Label htmlFor="edit-desc">설명</Label>
                <Textarea
                  id="edit-desc"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="설명"
                />
              </div>

              <div>
                <Label>카테고리</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm((f) => ({ ...f, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>마감일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !editForm.endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.endDate ? format(editForm.endDate, "yyyy년 MM월 dd일") : "날짜를 선택하세요"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editForm.endDate}
                      onSelect={(date) => setEditForm((f) => ({ ...f, endDate: date ?? undefined }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  if (!editingVote) return;
                  handleSaveEdit(editingVote, {
                    title: editForm.title,
                    description: editForm.description,
                    endDate: editForm.endDate,
                    category: editForm.category,
                  });
                  closeEditModal();
                }}
              >
                저장
              </Button>
              <Button className="flex-1" variant="outline" onClick={closeEditModal}>
                취소
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VotingSystem;