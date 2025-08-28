import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Plus, Trash2, DollarSign, Check, X } from "lucide-react";

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
  }
];

const PaymentCalculator = ({ groupId, members }: PaymentCalculatorProps) => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 지출 추가 버튼 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>지출 추가</span>
              </span>
              <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    새 지출
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              새 지출 버튼을 클릭하여 지출을 추가하세요.
            </p>
          </CardContent>
        </Card>

        {/* 정산 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>정산 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map(member => {
                const balance = balances[member.name] || 0;
                const isPositive = balance > 0;
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(Math.round(balance))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPositive ? '받을 금액' : '낼 금액'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 송금 현황 */}
      {transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>송금 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transfers.map((transfer, index) => {
                const status = getPaymentStatus(transfer.from, transfer.to);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{transfer.from}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{transfer.to}</span>
                      </div>
                      <span className="font-bold text-lg">{formatCurrency(transfer.amount)}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={status?.sent ? "default" : "outline"}
                        onClick={() => togglePaymentSent(transfer.from, transfer.to, transfer.amount)}
                        className="flex items-center space-x-1"
                      >
                        {status?.sent ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        <span>{status?.sent ? "보냈어요!" : "보내기"}</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={status?.received ? "default" : "outline"}
                        onClick={() => togglePaymentReceived(transfer.from, transfer.to, transfer.amount)}
                        className="flex items-center space-x-1"
                      >
                        {status?.received ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        <span>{status?.received ? "받았어요!" : "받기"}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 지출 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>지출 내역</CardTitle>
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
    </div>
  );
};

export default PaymentCalculator;
