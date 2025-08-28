
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calculator, Plus, Trash2, DollarSign } from "lucide-react";

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
}

// 임시 결제 데이터
const mockExpenses: Expense[] = [
  {
    id: "1",
    title: "제주도 숙소 예약",
    amount: 240000,
    paidBy: "김민수",
    splitAmong: ["김민수", "이지은", "박정우", "최유리"],
    date: "2025-03-01"
  },
  {
    id: "2",
    title: "렌터카 대여",
    amount: 120000,
    paidBy: "이지은",
    splitAmong: ["김민수", "이지은", "박정우", "최유리"],
    date: "2025-03-02"
  }
];

const PaymentCalculator = ({ groupId, members }: PaymentCalculatorProps) => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    paidBy: members[0]?.name || "",
    splitAmong: members.map(m => m.name)
  });

  const handleAddExpense = () => {
    if (newExpense.title && newExpense.amount && newExpense.paidBy) {
      const expense: Expense = {
        id: Date.now().toString(),
        title: newExpense.title,
        amount: parseInt(newExpense.amount),
        paidBy: newExpense.paidBy,
        splitAmong: newExpense.splitAmong,
        date: new Date().toISOString().split('T')[0]
      };
      setExpenses([...expenses, expense]);
      setNewExpense({
        title: "",
        amount: "",
        paidBy: members[0]?.name || "",
        splitAmong: members.map(m => m.name)
      });
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

  // 정산 계산
  const calculateSettlement = () => {
    const memberBalances: { [key: string]: number } = {};
    
    // 멤버별 잔액 초기화
    members.forEach(member => {
      memberBalances[member.name] = 0;
    });

    // 각 지출에 대해 계산
    expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.splitAmong.length;
      
      // 지불자는 전액 지불했으므로 플러스
      memberBalances[expense.paidBy] += expense.amount;
      
      // 분담자들은 각자 분담금만큼 마이너스
      expense.splitAmong.forEach(member => {
        memberBalances[member] -= splitAmount;
      });
    });

    return memberBalances;
  };

  const balances = calculateSettlement();
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
        {/* 지출 추가 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>지출 추가</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Button onClick={handleAddExpense} className="w-full">
              지출 추가
            </Button>
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
