// PaymentCalculator.tsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {get, post, del, put} from "@/lib/http";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Trash2, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** ===== Props & UI Types ===== */
interface PaymentCalculatorProps {
  groupId: string;
  members: Array<{ id: string; name: string; avatar?: string }>;
  currentMemberId: number;
}

type SplitType = "equal" | "custom";

/** ===== Server DTOs ===== */
interface ExpenseRes {
  id: number;
  title: string;
  amount: number;
  paidBy: number;
  paidAt: string;
  shares: Array<{ memberId: number; shareAmount: number }>;
}

// Settlement
type SettlementSnapshot = {
  balances: Record<string, number>;
  transfersDraft: Array<{ fromMemberId: number; toMemberId: number; amount: number; expenseId?: number }>;
};


/** ===== UI/Transfer DTOs ===== */
interface TransferRes {
  id: number;
  fromMemberId: number;
  fromName: string;
  toMemberId: number;
  toName: string;
  amount: number;
  sent: boolean;
  received: boolean;
}

interface BalanceRes {
  memberId: number;
  name: string;
  balance: number;
}

interface ExpenseUI {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  splitType: SplitType;
  customSplits?: { [memberName: string]: number };
}

// 커밋에 보낼 드래프트
type TransferCommitDraft = {
  fromMemberId: number;
  toMemberId: number;
  amount: number;
  expenseId?: number;
};

// 서버에서 내려오는 원본 DTO (TransferResponseDto)
type TransferServerDto = {
  id: number;
  groupId: number;
  fromMemberId: number;
  toMemberId: number;
  amount: number;
  status: "REQUESTED" | "SENT" | "CONFIRMED" | string;
  expenseId?: number | null;
  proofUrl?: string | null;
  memo?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type TransferDto = {
  id: number;
  fromMemberId: number;
  fromName: string;
  toMemberId: number;
  toName: string;
  amount: number;
  sent: boolean;
  received: boolean;
};

function normalizeTransfers(
    items: TransferServerDto[],
    members: { id: string; name: string }[]
): TransferDto[] {
  const nameById = (id: number) =>
      members.find((m) => Number(m.id) === id)?.name ?? `#${id}`;

  return (items ?? []).map((t) => ({
    id: t.id,
    fromMemberId: t.fromMemberId,
    fromName: nameById(t.fromMemberId),   // ✅ 이름 매핑
    toMemberId: t.toMemberId,
    toName: nameById(t.toMemberId),       // ✅ 이름 매핑
    amount: t.amount,
    sent: t.status === "SENT" || t.status === "CONFIRMED",
    received: t.status === "CONFIRMED",
  }));
}


/** ===== LocalStorage helpers (SSR-safe) ===== */
const LS_KEY = (groupId: string) => ({
  sig: `settlement:commitSig:${groupId}`,
  items: `settlement:committed:${groupId}`,
});

function stableSignature(drafts: TransferCommitDraft[]) {
  const sorted = drafts
      .slice()
      .sort(
          (a, b) =>
              a.fromMemberId - b.fromMemberId ||
              a.toMemberId - b.toMemberId ||
              a.amount - b.amount
      );
  return JSON.stringify(sorted);
}

function loadCommitted(groupId: string): TransferDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId).items);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveCommitted(groupId: string, sig: string, items: TransferDto[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY(groupId).sig, sig);
  localStorage.setItem(LS_KEY(groupId).items, JSON.stringify(items));
}

function patchCached(groupId: string, id: number, patch: Partial<TransferDto>) {
  const cur = loadCommitted(groupId);
  const next = cur.map((t) => (t.id === id ? { ...t, ...patch } : t));
  const sigKey = LS_KEY(groupId).sig;
  const sig = typeof window !== "undefined" ? localStorage.getItem(sigKey) ?? "[]" : "[]";
  saveCommitted(groupId, sig, next);
}

/** ===== API ===== */
const fetchExpenses = (groupId: string) =>
    get<ExpenseRes[]>(`/groups/${groupId}/expenses`);

const createExpense = (groupId: string, payload: any) =>
    post<ExpenseRes>(`/groups/${groupId}/expenses`, payload);

const updateExpense = (groupId: string, expenseId: number, payload: any) =>
    put<ExpenseRes>(`/groups/${groupId}/expenses/${expenseId}`, payload);

const deleteExpense = (groupId: string, expenseId: string | number) =>
    del(`/groups/${groupId}/expenses/${expenseId}`);

const commitTransfers = (groupId: string, drafts: TransferCommitDraft[]) =>
    post("/transfers/commit", {
      groupId,
      items: drafts.map(d => ({
        fromMemberId: d.fromMemberId,
        toMemberId: d.toMemberId,
        amount: d.amount,
        expenseId: d.expenseId ?? null,
      })),
    });



const sendTransfer = (groupId: string, transferId: number) =>
    post<void>(`/transfers/${transferId}/send?groupId=${groupId}`, {});

const confirmTransfer = (groupId: string, transferId: number) =>
    post<void>(`/transfers/${transferId}/confirm?groupId=${groupId}`, {});

const nudgeTransfer = (groupId: string, transferId: number) =>
    post<void>(`/transfers/${transferId}/nudge?groupId=${groupId}`, {});

/** ===== Settlement fetchers ===== */
const getMyTransfers = (groupId: string) =>
    get<TransferServerDto[]>(`/transfers/groups/${groupId}/transfers/me`);

const fetchMySettlement = async (
    groupId: string,
    members: { id: string; name: string }[]
): Promise<TransferDto[]> => {
  const current = await getMyTransfers(groupId);
  const normalized = normalizeTransfers(current, members);

  // 1) 서버 스냅샷 기준 시그니처 계산(선택)
  const sig = stableSignature(
      current.map((t) => ({
        fromMemberId: t.fromMemberId,
        toMemberId: t.toMemberId,
        amount: t.amount,
      }))
  );

  // 2) 로컬에 저장된 전송/확인 상태와 병합
  const cached = loadCommitted(groupId);
  const merged = normalized.map((t) => {
    const local = cached.find((c) => c.id === t.id);
    return local
        ? {
          ...t,
          // 서버가 아직 SENT로 안 바뀌었어도, 로컬에서 보냈다고 표시했으면 유지
          sent: t.sent || local.sent,
          received: t.received || local.received,
        }
        : t;
  });

  // 3) 병합 결과를 로컬에 저장(새로고침에도 유지)
  saveCommitted(groupId, sig, merged);

  // 4) 병합 결과를 반환
  return merged;
};

const fetchOverallSettlement = async (
    groupId: string,
    members: { id: string; name: string }[]
) => {
  const snap = await get<SettlementSnapshot>(`/groups/${groupId}/settlement/overall`);
  const nameById = (id: number) =>
      members.find((m) => Number(m.id) === id)?.name ?? `#${id}`;

  const res: BalanceRes[] = Object.entries(snap.balances ?? {}).map(([k, v]) => ({
    memberId: Number(k),
    name: nameById(Number(k)),
    balance: v ?? 0,
  }));
  res.sort((a, b) => b.balance - a.balance);
  return res;
};

/** ===== Helpers ===== */
const ymd = (iso?: string) =>
    (iso ? new Date(iso) : new Date()).toISOString().split("T")[0];

function makeEqualShares(amount: number, memberIds: number[]) {
  const n = Math.max(memberIds.length, 1);
  const base = Math.floor(amount / n);
  let rem = amount % n;
  return memberIds.map((id, idx) => ({
    memberId: id,
    shareAmount: base + (idx < rem ? 1 : 0),
  }));
}

function inferSplitType(
    shares: Array<{ memberId: number; shareAmount: number }>
): SplitType {
  if (shares.length <= 1) return "custom";
  const first = shares[0].shareAmount;
  return shares.every((s) => s.shareAmount === first) ? "equal" : "custom";
}

function mapExpenseToUI(e: ExpenseRes, nameById: (id: number) => string): ExpenseUI {
  const splitType = inferSplitType(e.shares);
  const splitAmong = e.shares.map((s) => nameById(s.memberId)).filter(Boolean);
  const customSplits =
      splitType === "custom"
          ? Object.fromEntries(e.shares.map((s) => [nameById(s.memberId), s.shareAmount]))
          : undefined;
  return {
    id: String(e.id),
    title: e.title,
    amount: e.amount,
    paidBy: nameById(e.paidBy),
    splitAmong,
    date: ymd(e.paidAt),
    splitType,
    customSplits,
  };
}

/** ===== Component ===== */
const PaymentCalculator = ({ groupId, members, currentMemberId }: PaymentCalculatorProps) => {
  const [activeTab, setActiveTab] =
      useState<"history" | "my-settlement" | "overall-settlement">("history");

  const idByName = useMemo(() => {
    const m = new Map<string, number>();
    members.forEach((mem) => m.set(mem.name, Number(mem.id)));
    return m;
  }, [members]);

  const myName = useMemo(
      () => members.find((m) => Number(m.id) === currentMemberId)?.name ?? "",
      [members, currentMemberId]
  );

  const nameByIdFn = (id: number) => {
    const found = members.find((m) => Number(m.id) === id);
    return found?.name ?? `#${id}`;
  };

  const qc = useQueryClient();

  // 지출 내역
  const { data: expensesRes, isLoading: isLoadingExpenses, isError: isErrorExpenses } =
      useQuery({
        queryKey: ["expenses", groupId],
        queryFn: () => fetchExpenses(groupId),
        staleTime: 30_000,
      });

  const expenses: ExpenseUI[] = useMemo(() => {
    if (!expensesRes) return [];
    return expensesRes
        .slice()
        .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))
        .map((e) => mapExpenseToUI(e, nameByIdFn));
  }, [expensesRes, members]);

  // 나의 정산
  const { data: myTransfers, isLoading: isLoadingMySettlement, isError: isErrorMySettlement } =
      useQuery({
        queryKey: ["settlement", "me", groupId],
        queryFn: () => fetchMySettlement(groupId, members),
        enabled: members.length > 0,
        staleTime: 60_000,
        refetchOnWindowFocus: false, // 포커스 때 중복 방지
        retry: 0                     // 필요 시
      });

  // 전체 정산
  const { data: overallBalances, isLoading: isLoadingOverall, isError: isErrorOverall } = useQuery({
    queryKey: ["settlement", "overall", groupId],
    queryFn: () => fetchOverallSettlement(groupId, members),
    enabled: members.length > 0 && activeTab === "overall-settlement",
    staleTime: 15_000,
  });

  const prefetchOverall = () => {
    if (members.length === 0) return;
    qc.prefetchQuery({
      queryKey: ["settlement", "overall", groupId],
      queryFn: () => fetchOverallSettlement(groupId, members),
      staleTime: 15_000,
    });
  };

  /** ===== Local UI State (폼/모달) ===== */
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState<{
    title: string;
    amount: string;
    paidBy: string;
    splitAmong: string[];
    splitType: SplitType;
    customSplits: { [memberName: string]: number };
  }>({
    title: "",
    amount: "",
    paidBy: myName || members[0]?.name || "",
    splitAmong: members.map((m) => m.name),
    splitType: "equal",
    customSplits: {},
  });

  useEffect(() => {
    if (!(window as any).appSocket) return;
    const socket = (window as any).appSocket; // STOMP client
    const subs: any[] = [];

    const onMessage = (msg: any) => {
      const payload = JSON.parse(msg.body);

      if (payload.type === "TRANSFER_SENT" && payload.groupId === Number(groupId)) {
        // 수신자 화면 → 입금 확인 버튼 활성화
        qc.setQueryData<TransferDto[]>(["settlement", "me", String(groupId)], (prev) => {
          if (!prev) return prev;
          return prev.map(t =>
              t.id === payload.transferId ? { ...t, sent: true } : t
          );
        });
      }

      if (payload.type === "TRANSFER_CONFIRMED" && payload.groupId === Number(groupId)) {
        // 송금자 화면 → 완료된 정산으로 이동
        qc.setQueryData<TransferDto[]>(["settlement", "me", String(groupId)], (prev) => {
          if (!prev) return prev;
          return prev.map(t =>
              t.id === payload.transferId ? { ...t, received: true } : t
          );
        });
        qc.invalidateQueries({ queryKey: ["settlement", "overall", String(groupId)] });
      }
    };

    // ✅ user 기반 단일 채널 구독
    subs.push(socket.subscribe(`/topic/notif/user/${currentMemberId}`, onMessage));

    return () => subs.forEach(s => s.unsubscribe());
  }, [groupId, currentMemberId, qc]);

  /** ===== Create/Delete Expense ===== */
  const { mutate: runCommit } = useMutation({
    mutationFn: async () => {
      const snap = await get<SettlementSnapshot>(`/groups/${groupId}/settlement/me`);
      const drafts = (snap.transfersDraft ?? []).map((d) => ({
        fromMemberId: d.fromMemberId,
        toMemberId: d.toMemberId,
        amount: d.amount,
        expenseId: d.expenseId,
      }));
      // 드래프트가 있을 때만 커밋 요청
      if (drafts.length > 0) {
        return commitTransfers(groupId, drafts);
      }
    },
    onSuccess: () => {
      // 커밋 후 정산 데이터를 다시 불러와 새 송금 내역을 표시
      qc.invalidateQueries({ queryKey: ["settlement", "me", groupId] });
      qc.invalidateQueries({ queryKey: ["settlement", "overall", groupId] });
    },
    onError: (e: any) => {
      alert(e?.message ?? "정산 내역을 업데이트하는 중 오류가 발생했습니다.");
    },
  });

  const { mutate: mutateCreate, isPending: creating } = useMutation({
    mutationFn: async () => {
      const title = newExpense.title.trim();
      if (!title) throw new Error("지출 내역을 입력하세요.");

      const amount = Number(newExpense.amount);
      if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
        throw new Error("금액을 올바르게 입력하세요. (정수, 1원 이상)");
      }

      const paidById = idByName.get(newExpense.paidBy);
      if (paidById == null) throw new Error("지불자를 선택하세요.");

      const selectedIds = newExpense.splitAmong
          .map((n) => idByName.get(n))
          .filter((id): id is number => id != null);

      if (selectedIds.length === 0) throw new Error("분담자를 1명 이상 선택하세요.");

      const payload =
          newExpense.splitType === "equal"
              ? { title, amount, paidBy: paidById, shares: makeEqualShares(amount, selectedIds) }
              : {
                title,
                amount,
                paidBy: paidById,
                shares: selectedIds.map((id) => ({
                  memberId: id,
                  shareAmount: newExpense.customSplits[nameByIdFn(id)] || 0,
                })),
              };

      return createExpense(groupId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", groupId] });
      runCommit(); // 지출 추가 후 정산 커밋 실행

      setIsAddingExpense(false);
      setNewExpense({
        title: "",
        amount: "",
        paidBy: myName || members[0]?.name || "",
        splitAmong: members.map((m) => m.name),
        splitType: "equal",
        customSplits: {},
      });
    },
    onError: (e: any) => {
      alert(e?.message ?? "지출 추가 중 오류가 발생했습니다.");
    },
  });

  const { mutate: mutateDelete } = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(groupId, expenseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", groupId] });
      runCommit(); // 지출 삭제 후 정산 커밋 실행
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        alert("이미 정산에 포함된 지출은 삭제할 수 없습니다.");
      } else {
        alert(e?.message ?? "삭제 중 오류가 발생했습니다.");
      }
    },
  });

  /** ===== My settlement subsets ===== */
  const myTransfersToReceive = useMemo(() => {
    if (!myTransfers || currentMemberId == null) return [];
    const myId = Number(currentMemberId);
    return myTransfers.filter((t) => t.toMemberId === myId && !t.received);
  }, [myTransfers, currentMemberId]);

  const myTransfersToSend = useMemo(() => {
    if (!myTransfers || currentMemberId == null) return [];
    const myId = Number(currentMemberId);
    return myTransfers.filter((t) => t.fromMemberId === myId && !t.sent);
  }, [myTransfers, currentMemberId]);

  const completedTransfers = useMemo(
      () => (myTransfers ?? []).filter((t) => t.sent && t.received),
      [myTransfers]
  );

  /** ===== Mutations: send / confirm / nudge ===== */
  const sendMut = useMutation({
    mutationFn: (transferId: number) => sendTransfer(groupId, transferId),
    onSuccess: (_data, id) => {
      patchCached(groupId, id, { sent: true });
      qc.invalidateQueries({ queryKey: ["settlement", "me", groupId] });
      qc.invalidateQueries({ queryKey: ["settlement", "overall", groupId] });
    },
    onError: (e: any) => alert(e?.message ?? "송금 처리 중 오류가 발생했습니다."),
  });

  const confirmMut = useMutation({
    mutationFn: (transferId: number) => confirmTransfer(groupId, transferId),
    onSuccess: (_data, id) => {
      // 1) 즉시 캐시 반영(프론트 메모리)
      qc.setQueryData<TransferDto[]>(["settlement","me",groupId], (prev) =>
          prev?.map(t => t.id === id ? { ...t, sent: true, received: true } : t) ?? prev
      );

      // 2) 로컬스토리지도 반영(유지)
      patchCached(groupId, id, { sent: true, received: true });

      // 3) 최종 일관성 확보용 리페치
      qc.invalidateQueries({ queryKey: ["settlement","me",groupId] });
      qc.invalidateQueries({ queryKey: ["settlement","overall",groupId] });
    }
  });

  const nudgeMut = useMutation({
    mutationFn: (transferId: number) => nudgeTransfer(groupId, transferId),
    onSuccess: () => alert("보채기 요청을 보냈습니다."),
    onError: (e: any) => alert(e?.message ?? "보채기 요청 중 오류가 발생했습니다."),
  });

  /** ===== Common UI Helpers ===== */
  const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("ko-KR").format(amount) + "원";

  /** ===== Render ===== */
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
      <div>
        <Tabs
            defaultValue="history"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "history" | "my-settlement" | "overall-settlement")}
            className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">지출 내역</TabsTrigger>
            <TabsTrigger value="my-settlement">나의 정산</TabsTrigger>
            {/*<TabsTrigger value="overall-settlement" onMouseEnter={prefetchOverall}>*/}
            {/*  전체 정산 현황*/}
            {/*</TabsTrigger>*/}
          </TabsList>

          {/* === 지출 내역 탭 === */}
          <TabsContent value="history">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>지출 내역</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingExpenses ? (
                    <p className="text-muted-foreground text-center py-8">불러오는 중…</p>
                ) : isErrorExpenses ? (
                    <p className="text-destructive text-center py-8">지출 목록 불러오기 실패</p>
                ) : expenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">아직 지출 내역이 없습니다.</p>
                ) : (
                    <div className="space-y-3">
                      {expenses.map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{exp.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {exp.paidBy}가 지불 • {exp.date}
                              </p>
                              <p className="text-xs text-muted-foreground">분담자: {exp.splitAmong.join(", ")}</p>
                              <p className="text-xs text-muted-foreground">
                                분담 방식: {exp.splitType === "equal" ? "균등분할" : "개별금액"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-bold">{formatCurrency(exp.amount)}</span>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => mutateDelete(exp.id)}
                                  className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                  <p className="text-sm text-muted-foreground">총 지출</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calculator className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{expenses.length}개</p>
                  <p className="text-sm text-muted-foreground">지출 항목</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="h-8 w-8 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {members.length}
                  </div>
                  <p className="text-2xl font-bold">
                    {members.length ? formatCurrency(Math.floor(totalExpenses / members.length)) : "0원"}
                  </p>
                  <p className="text-sm text-muted-foreground">1인당 평균</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === 나의 정산 탭 === */}
          <TabsContent value="my-settlement">
            <div className="space-y-6 mt-4">
              {/* 내가 받을 돈 */}
              <Card>
                <CardHeader>
                  <CardTitle>내가 받을 돈</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMySettlement ? (
                      <p className="text-muted-foreground text-center py-4">불러오는 중…</p>
                  ) : isErrorMySettlement ? (
                      <p className="text-destructive text-center py-4">정산 정보 불러오기 실패</p>
                  ) : (myTransfersToReceive?.length ?? 0) === 0 ? (
                      <p className="text-muted-foreground text-center py-4">받을 돈이 없습니다.</p>
                  ) : (
                      <div className="space-y-3">
                        {myTransfersToReceive.map((t) => (
                            <div key={t.id} className="border rounded-lg p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {t.fromName}님이 {formatCurrency(t.amount)}을(를) 보내야 합니다.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t.sent && !t.received ? `${t.fromName}님 → 송금 완료 (확인 대기)` : `아직 송금 안 됨`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => nudgeMut.mutate(t.id)} disabled={nudgeMut.isPending}>
                                  보채기
                                </Button>
                                <Button onClick={() => confirmMut.mutate(t.id)} disabled={!t.sent || confirmMut.isPending}>
                                  입금 확인
                                </Button>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* 내가 보낼 돈 */}
              <Card>
                <CardHeader>
                  <CardTitle>내가 보낼 돈</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMySettlement ? (
                      <p className="text-muted-foreground text-center py-4">불러오는 중…</p>
                  ) : isErrorMySettlement ? (
                      <p className="text-destructive text-center py-4">정산 정보 불러오기 실패</p>
                  ) : (myTransfersToSend?.length ?? 0) === 0 ? (
                      <p className="text-muted-foreground text-center py-4">보낼 돈이 없습니다.</p>
                  ) : (
                      <div className="space-y-3">
                        {myTransfersToSend.map((t) => (
                            <div key={t.id} className="border rounded-lg p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {t.toName}님에게 {formatCurrency(t.amount)}을(를) 보내야 합니다.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t.sent ? "송금 완료 (확인 대기)" : "아직 송금 안함"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => sendMut.mutate(t.id)} disabled={sendMut.isPending}>
                                  보냈어요
                                </Button>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* 완료된 정산 */}
              <Card>
                <CardHeader>
                  <CardTitle>완료된 정산</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMySettlement ? (
                      <p className="text-muted-foreground text-center py-4">불러오는 중…</p>
                  ) : isErrorMySettlement ? (
                      <p className="text-destructive text-center py-4">정산 정보 불러오기 실패</p>
                  ) : (completedTransfers?.length ?? 0) === 0 ? (
                      <p className="text-muted-foreground text-center py-4">완료된 정산 내역이 없습니다.</p>
                  ) : (
                      <div className="space-y-3">
                        {completedTransfers.map((t) => (
                            <div key={t.id} className="border rounded-lg p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {t.fromName}님 → {t.toName}님 {formatCurrency(t.amount)} 송금 완료
                                </p>
                                <p className="text-xs text-muted-foreground">✅ 송금 확인됨</p>
                              </div>
                              <Badge variant="secondary">완료</Badge>
                            </div>
                        ))}
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === 전체 정산 현황 탭 === */}
          <TabsContent value="overall-settlement">
            <div className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>전체 정산 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingOverall ? (
                      <p className="text-muted-foreground text-center py-4">불러오는 중…</p>
                  ) : isErrorOverall ? (
                      <p className="text-destructive text-center py-4">정산 현황 불러오기 실패</p>
                  ) : !overallBalances || overallBalances.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">정산 현황 데이터가 없습니다.</p>
                  ) : (
                      <div className="space-y-2">
                        {overallBalances.map((row) => {
                          const isPositive = row.balance > 0;
                          const avatar = members.find((m) => Number(m.id) === row.memberId)?.avatar;
                          return (
                              <div key={row.memberId} className="flex justify-between items-center p-4 border rounded-md">
                                <div className="flex items-center gap-2 text-base font-semibold">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={avatar} />
                                    <AvatarFallback>{row.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {row.name}
                                </div>
                                <div className={`text-right font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                                  {isPositive ? "+" : ""}
                                  {formatCurrency(Math.round(row.balance))}
                                  <div className="text-xs text-muted-foreground font-normal">
                                    {isPositive ? "받을 금액" : "낼 금액"}
                                  </div>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* === 지출 추가 모달 === */}
        <div className="fixed bottom-6 right-6 z-50">
          <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-lg bg-primary hover:bg-[rgb(35,100,50)] text-white px-6 py-3 text-base font-semibold">
                지출 추가하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 지출 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expense-title">지출 내역</Label>
                  <Input
                      id="expense-title"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      placeholder="예: 숙소 예약, 식사 등"
                  />
                </div>

                <div>
                  <Label htmlFor="expense-amount">금액</Label>
                  <Input
                      id="expense-amount"
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="paid-by">지불자</Label>
                  <select
                      id="paid-by"
                      value={newExpense.paidBy}
                      onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                      className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    {members.map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name}
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>분담 방식</Label>
                  <div className="flex space-x-4 mt-2">
                    <Button
                        type="button"
                        variant={newExpense.splitType === "equal" ? "default" : "outline"}
                        onClick={() => setNewExpense({ ...newExpense, splitType: "equal" })}
                    >
                      1/n (균등분할)
                    </Button>
                    <Button
                        type="button"
                        variant={newExpense.splitType === "custom" ? "default" : "outline"}
                        onClick={() => setNewExpense({ ...newExpense, splitType: "custom" })}
                    >
                      개별 금액
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>분담자 선택</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {members.map((member) => (
                        <Badge
                            key={member.id}
                            variant={newExpense.splitAmong.includes(member.name) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setNewExpense((cur) => ({
                                ...cur,
                                splitAmong: cur.splitAmong.includes(member.name)
                                    ? cur.splitAmong.filter((n) => n !== member.name)
                                    : [...cur.splitAmong, member.name],
                              }));
                            }}
                        >
                          {member.name}
                        </Badge>
                    ))}
                  </div>
                </div>

                {newExpense.splitType === "custom" && (
                    <div>
                      <Label>개별 분담 금액</Label>
                      <div className="space-y-2 mt-2">
                        {newExpense.splitAmong.map((memberName) => (
                            <div key={memberName} className="flex items-center space-x-2">
                              <span className="w-20 text-sm">{memberName}:</span>
                              <Input
                                  type="number"
                                  placeholder="0"
                                  value={newExpense.customSplits[memberName] ?? ""}
                                  onChange={(e) =>
                                      setNewExpense((cur) => ({
                                        ...cur,
                                        customSplits: {
                                          ...cur.customSplits,
                                          [memberName]: Number(e.target.value || 0),
                                        },
                                      }))
                                  }
                                  className="flex-1"
                              />
                              <span className="text-sm text-muted-foreground">원</span>
                            </div>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        총 분담금:{" "}
                        {new Intl.NumberFormat("ko-KR").format(
                            newExpense.splitAmong.reduce(
                                (sum, name) => sum + (newExpense.customSplits[name] || 0),
                                0
                            )
                        )}
                        원
                      </div>
                    </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => mutateCreate()} className="flex-1" disabled={creating}>
                    {creating ? "추가 중…" : "추가"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingExpense(false)} className="flex-1">
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  );
};

export default PaymentCalculator;