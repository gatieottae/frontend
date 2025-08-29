import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Plus, Trash2, DollarSign, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentCalculatorProps {
  groupId: string;
  members: Array<{ id: string; name: string; avatar?: string }>;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  splitType: "equal" | "custom";
  customSplits?: { [memberName: string]: number };
}

interface PaymentStatus {
  from: string;
  to: string;
  amount: number;
  sent: boolean;
  received: boolean;
}

// 임시 결제 데이터
const mockExpenses: Expense[] = [
  {
    id: "1",
    title: "제주도 숙소 예약",
    amount: 240000,
    paidBy: "김민수",
    splitAmong: ["김민수", "이지은", "박정우", "최유리"],
    date: "2025-03-01",
    splitType: "equal"
  },
  {
    id: "2",
    title: "렌터카 대여",
    amount: 120000,
    paidBy: "이지은",
    splitAmong: ["김민수", "이지은", "박정우", "최유리"],
    date: "2025-03-02",
    splitType: "equal"
  },
  {
    id: "3",
    title: "저녁 식사",
    amount: 40000,
    paidBy: "김민수",
    splitAmong: ["김민수", "박정우"],
    date: "2025-03-03",
    splitType: "equal"
  },
  {
    id: "4",
    title: "점심 식사",
    amount: 20000,
    paidBy: "박정우",
    splitAmong: ["김민수", "박정우"],
    date: "2025-03-04",
    splitType: "equal"
  }
];

// Add currentUser prop for 송금 상태 display logic
const PaymentCalculator = ({ groupId, members, currentUser }: PaymentCalculatorProps & { currentUser: string }) => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([{ from: "박정우", to: "김민수", amount: 20000, sent: true, received: true }]);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    paidBy: members[0]?.name || "",
    splitAmong: members.map(m => m.name),
    splitType: "equal" as "equal" | "custom",
    customSplits: {} as { [memberName: string]: number }
  });

  const handleAddExpense = () => {
    if (newExpense.title && newExpense.amount && newExpense.paidBy) {
      // Validation: 총 분담금 === 지출 금액
      if (newExpense.splitType === "custom") {
        const totalShares = Object.values(newExpense.customSplits).reduce((sum, amount) => sum + (amount || 0), 0);
        if (totalShares !== Number(newExpense.amount)) {
          alert("분담금 총합이 지출 금액과 일치하지 않습니다.");
          return;
        }
      }
      const expense: Expense = {
        id: Date.now().toString(),
        title: newExpense.title,
        amount: parseInt(newExpense.amount),
        paidBy: newExpense.paidBy,
        splitAmong: newExpense.splitAmong,
        date: new Date().toISOString().split('T')[0],
        splitType: newExpense.splitType,
        customSplits: newExpense.splitType === "custom" ? newExpense.customSplits : undefined
      };
      setExpenses([...expenses, expense]);
      setNewExpense({
        title: "",
        amount: "",
        paidBy: members[0]?.name || "",
        splitAmong: members.map(m => m.name),
        splitType: "equal",
        customSplits: {}
      });
      setIsAddingExpense(false);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(exp => exp.id !== expenseId));
  };

  const toggleMemberInSplit = (memberName: string) => {
    setNewExpense({
      ...newExpense,
      splitAmong: newExpense.splitAmong.includes(memberName)
        ? newExpense.splitAmong.filter(name => name !== memberName)
        : [...newExpense.splitAmong, memberName]
    });
  };

  const handleCustomSplitChange = (memberName: string, amount: string) => {
    setNewExpense({
      ...newExpense,
      customSplits: {
        ...newExpense.customSplits,
        [memberName]: parseFloat(amount) || 0
      }
    });
  };

  const togglePaymentSent = (from: string, to: string, amount: number) => {
    const key = `${from}-${to}`;
    setPaymentStatuses(prev => {
      const existing = prev.find(p => p.from === from && p.to === to);
      if (existing) {
        return prev.map(p =>
          p.from === from && p.to === to
            ? { ...p, sent: !p.sent }
            : p
        );
      } else {
        return [...prev, { from, to, amount, sent: true, received: false }];
      }
    });
  };

  const togglePaymentReceived = (from: string, to: string, amount: number) => {
    const key = `${from}-${to}`;
    setPaymentStatuses(prev => {
      const existing = prev.find(p => p.from === from && p.to === to);
      if (existing) {
        return prev.map(p =>
          p.from === from && p.to === to
            ? { ...p, received: !p.received }
            : p
        );
      } else {
        return [...prev, { from, to, amount, sent: false, received: true }];
      }
    });
  };

  const getPaymentStatus = (from: string, to: string) => {
    return paymentStatuses.find(p => p.from === from && p.to === to);
  };

  // ---- MOCK 송금 상태 예시 UI ----
  // This is mock UI logic for payment state simulation
  // 상태: "initial", "toSend", "waitingConfirm", "confirmed", "cancelled"
  // a: currentUser, b: 상대방
  // 화면 예시를 아래 컴포넌트에서 하드코딩 렌더링합니다.
  type PaymentMockState = "initial" | "toSend" | "waitingConfirm" | "confirmed" | "cancelled";
  // a가 currentUser, b가 "이지은"이라고 가정
  const a = currentUser;
  const b = "이지은";
  // 상태 예시: 바꿔가며 확인할 수 있음
  const exampleStates: PaymentMockState[] = [
    "initial", "toSend", "waitingConfirm", "confirmed", "cancelled"
  ];
  // 실제로는 아래 state를 바꿔가며 UI를 확인
  const state: PaymentMockState = "initial"; // <- 여기서 상태를 바꿔 테스트

  // 정산 계산
  const calculateSettlement = () => {
    const memberBalances: { [key: string]: number } = {};

    // 멤버별 잔액 초기화
    members.forEach(member => {
      memberBalances[member.name] = 0;
    });

    // 각 지출에 대해 계산
    expenses.forEach(expense => {
      if (expense.splitType === "equal") {
        const splitAmount = expense.amount / expense.splitAmong.length;

        // 지불자는 전액 지불했으므로 플러스
        memberBalances[expense.paidBy] += expense.amount;

        // 분담자들은 각자 분담금만큼 마이너스
        expense.splitAmong.forEach(member => {
          memberBalances[member] -= splitAmount;
        });
      } else if (expense.splitType === "custom" && expense.customSplits) {
        // 지불자는 전액 지불했으므로 플러스
        memberBalances[expense.paidBy] += expense.amount;

        // 분담자들은 각자 설정된 금액만큼 마이너스
        Object.entries(expense.customSplits).forEach(([member, amount]) => {
          memberBalances[member] -= amount;
        });
      }
    });

    return memberBalances;
  };

  const calculateTransfers = () => {
    const balances = calculateSettlement();
    console.log("Member Balances:", balances); // Debug log
    const transfers: { from: string; to: string; amount: number }[] = [];

    const debtors = Object.entries(balances).filter(([_, balance]) => balance < 0);
    const creditors = Object.entries(balances).filter(([_, balance]) => balance > 0);

    debtors.forEach(([debtor, debt]) => {
      creditors.forEach(([creditor, credit]) => {
        if (Math.abs(debt) > 0 && credit > 0) {
          const transferAmount = Math.min(Math.abs(debt), credit);
          transfers.push({
            from: debtor,
            to: creditor,
            amount: Math.round(transferAmount)
          });

          balances[debtor] += transferAmount;
          balances[creditor] -= transferAmount;
        }
      });
    });

    return transfers.filter(t => t.amount > 0);
  };

  const balances = calculateSettlement();
  const transfers = calculateTransfers();
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Categorize transfers for the current user
  const myTransfersToReceive = transfers.filter(
    (t) => t.to === currentUser && !(getPaymentStatus(t.from, t.to)?.received)
  );
  const myTransfersToSend = transfers.filter(
    (t) => t.from === currentUser && !(getPaymentStatus(t.from, t.to)?.sent)
  );
  const completedTransfers = transfers.filter(
    (t) => (getPaymentStatus(t.from, t.to)?.sent) && (getPaymentStatus(t.from, t.to)?.received)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getTransferStatusText = (from: string, to: string) => {
    const status = getPaymentStatus(from, to);
    if (status?.sent && status?.received) return "✅ 송금 확인됨";
    if (status?.sent && !status?.received) return `${from}님 → 송금 완료 (확인 대기)`;
    return `${from}님 → 아직 송금 안함`;
  };
  return (
    <div>
      <Tabs defaultValue="my-settlement" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">지출 내역</TabsTrigger>
          <TabsTrigger value="my-settlement">나의 정산</TabsTrigger>
          <TabsTrigger value="overall-settlement">전체 정산 현황</TabsTrigger>
        </TabsList>


        <TabsContent value="history">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>지출 내역</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    아직 지출 내역이 없습니다.
                  </p>
              ) : (
                  <div className="space-y-3">
                    {expenses.map(expense => (
                        <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{expense.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {expense.paidBy}가 지불 • {expense.date}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              분담자: {expense.splitAmong.join(', ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              분담 방식: {expense.splitType === "equal" ? "균등분할" : "개별금액"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-bold">{formatCurrency(expense.amount)}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteExpense(expense.id)}
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
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses / members.length)}</p>
                <p className="text-sm text-muted-foreground">1인당 평균</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my-settlement">
          <div className="space-y-6 mt-4">
            {/* 내가 받을 돈 */}
            <Card>
              <CardHeader>
                <CardTitle>내가 받을 돈</CardTitle>
              </CardHeader>
              <CardContent>
                {myTransfersToReceive.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      받을 돈이 없습니다.
                    </p>
                ) : (
                    <div className="space-y-3">
                      {myTransfersToReceive.map((transfer, index) => (
                          <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {transfer.from}님이 {formatCurrency(transfer.amount)}을(를) 보내야 합니다.
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getTransferStatusText(transfer.from, transfer.to)}
                              </p>
                            </div>
                            <button
                                className="bg-green-700 text-white px-4 py-1 rounded-md text-sm"
                                onClick={() => alert("보채기 요청 완료")}
                            >
                              보채기
                            </button>
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
                {(() => {
                  // Example transfer for visual test purposes
                  const exampleSendTransfer = {
                    from: currentUser,
                    to: "최유리",
                    amount: 90000,
                    sent: false,
                    received: false,
                  };
                  const allTransfersToSend = [...(myTransfersToSend.length === 0 ? [exampleSendTransfer] : myTransfersToSend)];
                  // State to track "sent" per transfer (by index or key)
                  const [sentStates, setSentStates] = useState<{ [key: string]: boolean }>({});
                  const handleSentClick = (transferKey: string) => {
                    setSentStates(prev => ({ ...prev, [transferKey]: true }));
                  };
                  return (
                      <>
                        {allTransfersToSend.length > 0 ? (
                            <>
                              {/* 예시 섹션 (첫 번째 pending payment만 보여줌) */}
                              <div className="rounded-md border p-4 mb-4">
                                <div className="font-bold">
                                  {allTransfersToSend[0].to}님이 {formatCurrency(allTransfersToSend[0].amount)}을(를) 보내야 합니다.
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {allTransfersToSend[0].to} ➝ 아직 송금 안함
                                </div>
                              </div>
                              <div className="space-y-3">
                                {allTransfersToSend.map((transfer, index) => {
                                  const transferKey = `${transfer.from}-${transfer.to}-${transfer.amount}`;
                                  // If paymentStatuses already has .sent true, always show "확인 대기"
                                  const status = getPaymentStatus(transfer.from, transfer.to);
                                  const sent = status?.sent || sentStates[transferKey];
                                  return (
                                      <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">
                                            {transfer.to}님에게 {formatCurrency(transfer.amount)}을(를) 보내야 합니다.
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {typeof getTransferStatusText === "function"
                                                ? getTransferStatusText(transfer.from, transfer.to)
                                                : ""}
                                          </p>
                                        </div>
                                        <button
                                            className="bg-green-700 text-white px-4 py-1 rounded-md text-sm"
                                            onClick={() => {
                                              if (!sent) {
                                                handleSentClick(transferKey);
                                                togglePaymentSent(transfer.from, transfer.to, transfer.amount);
                                              }
                                            }}
                                        >
                                          {sent ? "확인 대기" : "보냈어요"}
                                        </button>
                                      </div>
                                  );
                                })}
                              </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                              보낼 돈이 없습니다.
                            </p>
                        )}
                      </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* 완료된 정산 */}
            <Card>
              <CardHeader>
                <CardTitle>완료된 정산</CardTitle>
              </CardHeader>
              <CardContent>
                {completedTransfers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      완료된 정산 내역이 없습니다.
                    </p>
                ) : (
                    <div className="space-y-3">
                      {completedTransfers.map((transfer, index) => (
                          <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {transfer.from}님이 {transfer.to}님에게 {formatCurrency(transfer.amount)}을(를) 보냈습니다.
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getTransferStatusText(transfer.from, transfer.to)}
                              </p>
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

        <TabsContent value="overall-settlement">
          <div className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>전체 정산 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {members.map(member => {
                    const balance = balances[member.name] || 0;
                    const isPositive = balance > 0;
                    return (
                      <div
                        key={member.id}
                        className="flex justify-between items-center p-4 border rounded-md"
                      >
                        <div className="flex items-center gap-2 text-base font-semibold">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                        <div
                          className={`text-right font-bold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {formatCurrency(Math.round(balance))}
                          <div className="text-xs text-muted-foreground font-normal">
                            {isPositive ? '받을 금액' : '낼 금액'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>





      </Tabs>

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
                  onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                  placeholder="예: 숙소 예약, 식사 등"
                />
              </div>

              <div>
                <Label htmlFor="expense-amount">금액</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="paid-by">지불자</Label>
                <select
                  id="paid-by"
                  value={newExpense.paidBy}
                  onChange={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  {members.map(member => (
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
                    onClick={() => setNewExpense({...newExpense, splitType: "equal"})}
                  >
                    1/n (균등분할)
                  </Button>
                  <Button
                    type="button"
                    variant={newExpense.splitType === "custom" ? "default" : "outline"}
                    onClick={() => setNewExpense({...newExpense, splitType: "custom"})}
                  >
                    개별 금액
                  </Button>
                </div>
              </div>

              <div>
                <Label>분담자 선택</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {members.map(member => (
                      <Badge
                        key={member.id}
                        variant={newExpense.splitAmong.includes(member.name) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleMemberInSplit(member.name)}
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
                    {newExpense.splitAmong.map(memberName => (
                      <div key={memberName} className="flex items-center space-x-2">
                        <span className="w-20 text-sm">{memberName}:</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newExpense.customSplits[memberName] || ""}
                          onChange={(e) => handleCustomSplitChange(memberName, e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">원</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    총 분담금: {Object.values(newExpense.customSplits).reduce((sum, amount) => sum + (amount || 0), 0).toLocaleString()}원
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={handleAddExpense} className="flex-1">
                  추가
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
