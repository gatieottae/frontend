
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Calculator, DollarSign, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentCalculatorProps {
  groupId: string;
  members: Array<{ id: string; name: string; avatar?: string; isAdmin: boolean }>;
  currentUser: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  paidBy: string;
  category: string;
  date: string;
  participants: string[];
}

const PaymentCalculator = ({ groupId, members, currentUser }: PaymentCalculatorProps) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      name: "숙박비",
      amount: 200000,
      paidBy: "김민수",
      category: "숙박",
      date: "2024-03-15",
      participants: ["김민수", "이지은", "박정우", "최유리"]
    },
    {
      id: "2",
      name: "저녁식사",
      amount: 80000,
      paidBy: "이지은",
      category: "식비",
      date: "2024-03-15",
      participants: ["김민수", "이지은", "박정우", "최유리"]
    }
  ]);

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    paidBy: currentUser,
    category: "식비",
    participants: members.map(m => m.name)
  });

  const categories = ["식비", "숙박", "교통", "쇼핑", "활동", "기타"];

  const calculateSettlement = () => {
    const balances: { [key: string]: number } = {};
    
    // 각 멤버의 잔액 초기화
    members.forEach(member => {
      balances[member.name] = 0;
    });

    // 각 지출에 대해 계산
    expenses.forEach(expense => {
      const perPerson = expense.amount / expense.participants.length;
      
      // 지불한 사람은 플러스
      balances[expense.paidBy] += expense.amount;
      
      // 참여자들은 각자 몫만큼 마이너스
      expense.participants.forEach(participant => {
        balances[participant] -= perPerson;
      });
    });

    return balances;
  };

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount) {
      toast({
        title: "입력 오류",
        description: "지출명과 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      name: newExpense.name,
      amount: parseInt(newExpense.amount),
      paidBy: newExpense.paidBy,
      category: newExpense.category,
      date: new Date().toISOString().split('T')[0],
      participants: newExpense.participants
    };

    setExpenses([...expenses, expense]);
    setNewExpense({
      name: "",
      amount: "",
      paidBy: currentUser,
      category: "식비",
      participants: members.map(m => m.name)
    });

    setAddExpenseOpen(false);
    toast({
      title: "지출 추가됨",
      description: "새로운 지출이 추가되었습니다.",
    });
  };

  const handleEditExpense = () => {
    if (!editingExpense) return;

    setExpenses(expenses.map(expense => 
      expense.id === editingExpense.id ? editingExpense : expense
    ));

    setEditExpenseOpen(false);
    setEditingExpense(null);
    toast({
      title: "지출 수정됨",
      description: "지출 내용이 수정되었습니다.",
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId));
    toast({
      title: "지출 삭제됨",
      description: "지출이 삭제되었습니다.",
    });
  };

  const startEditExpense = (expense: Expense) => {
    setEditingExpense({ ...expense });
    setEditExpenseOpen(true);
  };

  const balances = calculateSettlement();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>지출 요약</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalExpenses.toLocaleString()}원
              </div>
              <div className="text-sm text-muted-foreground">총 지출</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {expenses.length}건
              </div>
              <div className="text-sm text-muted-foreground">지출 건수</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <h4 className="font-medium">정산 결과</h4>
            {Object.entries(balances).map(([member, balance]) => (
              <div key={member} className="flex justify-between items-center">
                <span>{member}</span>
                <span className={balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-muted-foreground"}>
                  {balance > 0 ? "+" : ""}{balance.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>지출 내역</span>
            </CardTitle>
            <Button onClick={() => setAddExpenseOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              지출 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{expense.name}</h4>
                      <Badge variant="outline">{expense.category}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>금액: {expense.amount.toLocaleString()}원</div>
                      <div>결제자: {expense.paidBy}</div>
                      <div>참여자: {expense.participants.join(", ")}</div>
                      <div>날짜: {expense.date}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditExpense(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>지출 추가</DialogTitle>
            <DialogDescription>새로운 지출을 추가하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">지출명</Label>
              <Input
                id="expense-name"
                value={newExpense.name}
                onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                placeholder="예: 저녁식사"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expense-amount">금액</Label>
              <Input
                id="expense-amount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>결제자</Label>
              <Select value={newExpense.paidBy} onValueChange={(value) => setNewExpense({...newExpense, paidBy: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setAddExpenseOpen(false)} className="flex-1">
                취소
              </Button>
              <Button onClick={handleAddExpense} className="flex-1">
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editExpenseOpen} onOpenChange={setEditExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>지출 수정</DialogTitle>
            <DialogDescription>지출 내용을 수정하세요</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense-name">지출명</Label>
                <Input
                  id="edit-expense-name"
                  value={editingExpense.name}
                  onChange={(e) => setEditingExpense({...editingExpense, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-expense-amount">금액</Label>
                <Input
                  id="edit-expense-amount"
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({...editingExpense, amount: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <Label>결제자</Label>
                <Select value={editingExpense.paidBy} onValueChange={(value) => setEditingExpense({...editingExpense, paidBy: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select value={editingExpense.category} onValueChange={(value) => setEditingExpense({...editingExpense, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setEditExpenseOpen(false)} className="flex-1">
                  취소
                </Button>
                <Button onClick={handleEditExpense} className="flex-1">
                  수정
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentCalculator;
