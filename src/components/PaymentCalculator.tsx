// PaymentCalculator.tsx
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "@/lib/http";

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
  currentUser: string; // 이름
}

type SplitType = "equal" | "custom";

interface ExpenseUI {
  id: string;
  title: string;
  amount: number; // 원 단위 정수
  paidBy: string; // 이름
  splitAmong: string[]; // 이름 배열
  date: string; // YYYY-MM-DD
  splitType: SplitType;
  customSplits?: { [memberName: string]: number };
}

interface PaymentStatus {
  from: string;
  to: string;
  amount: number;
  sent: boolean;
  received: boolean;
}

/** ===== Server DTO (가정) ===== */
interface ExpenseRes {
  id: number;
  title: string;
  amount: number;          // BIGINT(원)
  paidById: number;
  paidAt: string;          // ISO
  shares: Array<{ memberId: number; share: number }>;
}

/** ===== API Calls ===== */
const fetchExpenses = (groupId: string) =>
    get<ExpenseRes[]>(`/groups/${groupId}/expenses`);

const createExpense = (groupId: string, payload: any) =>
    post<ExpenseRes>(`/groups/${groupId}/expenses`, payload);

const deleteExpense = (groupId: string, expenseId: string | number) =>
    del(`/groups/${groupId}/expenses/${expenseId}`);

/** ===== Helpers ===== */
const ymd = (iso?: string) =>
    (iso ? new Date(iso) : new Date()).toISOString().split("T")[0];

/** 균등 분배(원 단위) — 나머지는 앞에서부터 +1로 분배 */
function makeEqualShares(amount: number, memberIds: number[]) {
  const n = memberIds.length;
  const base = Math.floor(amount / n);
  let rem = amount % n;
  return memberIds.map((id, idx) => ({
    memberId: id,
    share: base + (idx < rem ? 1 : 0),
  }));
}

/** shares로부터 splitType 추론 (모두 동일 금액이면 equal) */
function inferSplitType(shares: Array<{ memberId: number; share: number }>): SplitType {
  if (shares.length <= 1) return "custom";
  const first = shares[0].share;
  return shares.every(s => s.share === first) ? "equal" : "custom";
}

/** 서버 → UI 매핑 */
function mapExpenseToUI(e: ExpenseRes, nameById: (id: number) => string): ExpenseUI {
  const splitType = inferSplitType(e.shares);
  const splitAmong = e.shares.map(s => nameById(s.memberId)).filter(Boolean);
  const customSplits =
      splitType === "custom"
          ? Object.fromEntries(e.shares.map(s => [nameById(s.memberId), s.share]))
          : undefined;
  return {
    id: String(e.id),
    title: e.title,
    amount: e.amount,
    paidBy: nameById(e.paidById),
    splitAmong,
    date: ymd(e.paidAt),
    splitType,
    customSplits,
  };
}

const PaymentCalculator = ({ groupId, members, currentUser }: PaymentCalculatorProps) => {
  /** ===== Member Mappings (id ↔ name) ===== */
  const idByName = useMemo(() => {
    const m = new Map<string, number>();
    members.forEach(mem => m.set(mem.name, Number(mem.id)));
    return m;
  }, [members]);

  const nameByIdFn = (id: number) => {
    const found = members.find(m => Number(m.id) === id);
    return found?.name ?? `#${id}`;
  };

  /** ===== Local UI State (폼/모달/송금 가짜상태) ===== */
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([
    { from: "박정우", to: "김민수", amount: 20000, sent: true, received: true },
  ]);

  const [newExpense, setNewExpense] = useState<{
    title: string;
    amount: string; // 입력값 문자열
    paidBy: string; // 이름
    splitAmong: string[];
    splitType: SplitType;
    customSplits: { [memberName: string]: number };
  }>({
    title: "",
    amount: "",
    paidBy: members[0]?.name || "",
    splitAmong: members.map(m => m.name),
    splitType: "equal",
    customSplits: {},
  });

  /** ===== React Query: expenses ===== */
  const qc = useQueryClient();

  const { data: expensesRes, isLoading, isError } = useQuery({
    queryKey: ["expenses", groupId],
    queryFn: () => fetchExpenses(groupId),
    staleTime: 30_000,
  });

  const expenses: ExpenseUI[] = useMemo(() => {
    if (!expensesRes) return [];
    return expensesRes
        .slice()
        .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1)) // 최신순
        .map(e => mapExpenseToUI(e, nameByIdFn));
  }, [expensesRes]);

  /** ===== Create ===== */
  const { mutate: mutateCreate, isPending: creating } = useMutation({
    mutationFn: async () => {
      // --- 입력 검증 ---
      const title = newExpense.title.trim();
      if (!title) throw new Error("지출 내역을 입력하세요.");

      const amount = Number(newExpense.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("금액을 올바르게 입력하세요. (정수, 1원 이상)");
      }

      const paidById = idByName.get(newExpense.paidBy);
      if (paidById == null) {
        throw new Error("지불자를 선택하세요.");
      }

      const selectedIds = newExpense.splitAmong
        .map((n) => idByName.get(n))
        .filter((id): id is number => id != null);

      if (selectedIds.length === 0) {
        throw new Error("분담자를 1명 이상 선택하세요.");
      }

      // --- shares 생성 ---
      let shares: Array<{ memberId: number; share: number }>;
      if (newExpense.splitType === "equal") {
        shares = makeEqualShares(amount, selectedIds);
      } else {
        const sum = selectedIds
          .map((id) => newExpense.customSplits[nameByIdFn(id)] || 0)
          .reduce((a, b) => a + b, 0);

        if (sum !== amount) {
          throw new Error("분담금 총합이 지출 금액과 일치하지 않습니다.");
        }

        shares = selectedIds.map((id) => ({
          memberId: id,
          share: newExpense.customSplits[nameByIdFn(id)] || 0,
        }));
      }

      // --- 날짜 포맷: YYYY-MM-DDTHH:mm:ss ---
      const paidAt = new Date().toISOString().split(".")[0];

      // --- 서버 전송 페이로드 ---
      const payload = {
        title,
        amount,
        paidById,
        paidAt,
        shares,
      };

      return createExpense(groupId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", groupId] });
      setIsAddingExpense(false);
      setNewExpense({
        title: "",
        amount: "",
        paidBy: members[0]?.name || "",
        splitAmong: members.map(m => m.name),
        splitType: "equal",
        customSplits: {},
      });
    },
    onError: (e: any) => {
      alert(e?.message ?? "지출 추가 중 오류가 발생했습니다.");
    },
  });

  /** ===== Delete ===== */
  const { mutate: mutateDelete } = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(groupId, expenseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", groupId] }),
    onError: (e: any) => alert(e?.message ?? "삭제 중 오류가 발생했습니다."),
  });

  /** ===== 기존 송금 UI 가짜로 유지 (다음 단계에 API/WS 연결) ===== */
  const togglePaymentSent = (from: string, to: string, amount: number) => {
    setPaymentStatuses(prev => {
      const existing = prev.find(p => p.from === from && p.to === to);
      if (existing) {
        return prev.map(p => (p.from === from && p.to === to ? { ...p, sent: !p.sent } : p));
      } else {
        return [...prev, { from, to, amount, sent: true, received: false }];
      }
    });
  };
  const getPaymentStatus = (from: string, to: string) =>
      paymentStatuses.find(p => p.from === from && p.to === to);

  /** ===== 기존 계산 로직은 UI용으로 유지 (서버 연동 전 임시) ===== */
  const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("ko-KR").format(amount) + "원";

  const calculateSettlement = () => {
    const memberBalances: { [key: string]: number } = {};
    members.forEach(m => (memberBalances[m.name] = 0));
    expenses.forEach(exp => {
      if (exp.splitType === "equal") {
        const splitAmount = Math.floor(exp.amount / exp.splitAmong.length);
        let rem = exp.amount % exp.splitAmong.length;
        memberBalances[exp.paidBy] += exp.amount;
        exp.splitAmong.forEach((name, idx) => {
          const a = splitAmount + (idx < rem ? 1 : 0);
          memberBalances[name] -= a;
        });
      } else if (exp.customSplits) {
        memberBalances[exp.paidBy] += exp.amount;
        Object.entries(exp.customSplits).forEach(([name, a]) => {
          memberBalances[name] -= a;
        });
      }
    });
    return memberBalances;
  };

  const calculateTransfers = () => {
    const balances = calculateSettlement();
    const transfers: { from: string; to: string; amount: number }[] = [];
    const debtors = Object.entries(balances).filter(([_, b]) => b < 0);
    const creditors = Object.entries(balances).filter(([_, b]) => b > 0);
    debtors.forEach(([debtor, debt]) => {
      creditors.forEach(([creditor, credit]) => {
        if (Math.abs(debt) > 0 && credit > 0) {
          const t = Math.min(Math.abs(debt), credit);
          transfers.push({ from: debtor, to: creditor, amount: Math.round(t) });
          balances[debtor] += t;
          balances[creditor] -= t;
        }
      });
    });
    return transfers.filter(t => t.amount > 0);
  };

  const balances = calculateSettlement();
  const transfers = calculateTransfers();
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const myTransfersToReceive = transfers.filter(
      t => t.to === currentUser && !(getPaymentStatus(t.from, t.to)?.received),
  );
  const myTransfersToSend = transfers.filter(
      t => t.from === currentUser && !(getPaymentStatus(t.from, t.to)?.sent),
  );
  const completedTransfers = transfers.filter(
      t => getPaymentStatus(t.from, t.to)?.sent && getPaymentStatus(t.from, t.to)?.received,
  );

  const getTransferStatusText = (from: string, to: string) => {
    const status = getPaymentStatus(from, to);
    if (status?.sent && status?.received) return "✅ 송금 확인됨";
    if (status?.sent && !status?.received) return `${from}님 → 송금 완료 (확인 대기)`;
    return `${from}님 → 아직 송금 안함`;
  };

  /** ===== Render ===== */
  return (
      <div>
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">지출 내역</TabsTrigger>
            <TabsTrigger value="my-settlement">나의 정산</TabsTrigger>
            <TabsTrigger value="overall-settlement">전체 정산 현황</TabsTrigger>
          </TabsList>

          {/* === 지출 내역 탭 === */}
          <TabsContent value="history">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>지출 내역</span>
                  {/* 필요 시 정렬/필터 컨트롤 추가 예정 */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                    <p className="text-muted-foreground text-center py-8">불러오는 중…</p>
                ) : isError ? (
                    <p className="text-destructive text-center py-8">지출 목록 불러오기 실패</p>
                ) : expenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">아직 지출 내역이 없습니다.</p>
                ) : (
                    <div className="space-y-3">
                      {expenses.map(exp => (
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

          {/* === 나의 정산 / 전체 현황 탭 ===
            다음 단계에서 API/WS 연동으로 교체 예정 (지금은 기존 UI 계산 로직 유지) */}
          <TabsContent value="my-settlement">
            {/* ... 기존 코드 그대로 (상단 계산 값은 expenses를 기반으로 동작) ... */}
          </TabsContent>

          <TabsContent value="overall-settlement">
            {/* ... 기존 코드 그대로 (상단 balances 기반) ... */}
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
                                0,
                            ),
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