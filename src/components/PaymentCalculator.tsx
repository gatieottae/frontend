import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calculator, Receipt, Edit2, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditExpenseDialog from "./EditExpenseDialog";

interface PaymentCalculatorProps {
  groupId: string;
  members: Array<{ id: string; name: string; avatar?: string; isAdmin: boolean }>;
  currentUser: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  category: string;
  description?: string;
  date: string;
  splitWith: string[];
}

// 임시 지출 데이터
const mockExpenses: Expense[] = [
  {
    id: "1",
    title: "첫날 저녁 식사",
    amount: 80000,
    paidBy: "김민수",
    category: "식비",
    description: "흑돼지 구이 맛집",
    date: "2025-03-15",
    splitWith: ["김민수", "이지은", "박정우", "최유리"]
  },
  {
    id: "2",
    title: "렌터카 대여",
    amount: 120000,
    paidBy: "박정우",
    category: "교통",
    description: "2박 3일 렌터카",
    date: "2025-03-15",
    splitWith: ["김민수", "이지은", "박정우", "최유리"]
  }
];

const categories = [
  { value: "숙박", label: "숙박" },
  { value: "교통", label: "교통" },
  { value: "식비", label: "식비" },
  { value: "활동", label: "활동" },
  { value: "쇼핑", label: "쇼핑" },
  { value: "기타", label: "기타" }
];

const PaymentCalculator = ({ groupId, members, currentUser }: PaymentCalculatorProps) => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    paidBy: "",
    category: "",
    description: "",
    splitWith: [] as string[]
  });

  const handleAddExpense = () => {
    if (!newExpense.title || !newExpense.amount || !newExpense.paidBy) {
      toast({
        title: "필수 항목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      title: newExpense.title,
      amount: parseInt(newExpense.amount),
      paidBy: newExpense.paidBy,
      category: newExpense.category || "기타",
      description: newExpense.description,
      date: new Date().toISOString().split('T')[0],
      splitWith: newExpense.splitWith.length > 0 ? newExpense.splitWith : members.map(m => m.name)
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({
      title: "",
      amount: "",
      paidBy: "",
      category: "",
      description: "",
      splitWith: []
    });
    setIsAddingExpense(false);
    toast({
      title: "지출이 추가되었습니다",
    });
  };

  const handleEditExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map(exp => 
      exp.id === updatedExpense.id ? updatedExpense : exp
    ));
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(exp => exp.id !== expenseId));
    toast({
      title: "지출이 삭제되었습니다",
    });
  };

  const toggleSplitMember = (memberId: string) => {
    setNewExpense(prev => ({
      ...prev,
      splitWith: prev.splitWith.includes(memberId)
        ? prev.splitWith.filter(id => id !== memberId)
        : [...prev.splitWith, memberId]
    }));
  };

  const calculateBalances = () => {
    const balances: Record<string, number> = {};
    members.forEach(member => {
      balances[member.name] = 0;
    });

    expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.splitWith.length;
      
      // 결제자는 전체 금액을 지불했으므로 +
      balances[expense.paidBy] += expense.amount;
      
      // 분할 대상자들은 각자의 몫을 차감
      expense.splitWith.forEach(person => {
        balances[person] -= splitAmount;
      });
    });

    return balances;
  };

  const balances = calculateBalances();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "숙박": return "bg-blue-100 text-blue-800";
      case "교통": return "bg-green-100 text-green-800";
      case "식비": return "bg-orange-100 text-orange-800";
      case "활동": return "bg-purple-100 text-purple-800";
      case "쇼핑": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* 총 지출 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>총 지출 현황</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              ₩{totalExpenses.toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              총 {expenses.length}건의 지출
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 정산 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>정산 현황</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => {
              const balance = balances[member.name];
              const isOwed = balance > 0;
              const isOwing = balance < 0;
              
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
                    {Math.abs(balance) < 1 ? (
                      <Badge variant="outline">정산 완료</Badge>
                    ) : isOwed ? (
                      <div className="text-green-600 font-medium">
                        +₩{Math.abs(balance).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-red-600 font-medium">
                        -₩{Math.abs(balance).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 지출 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>지출 내역</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 등록된 지출이 없습니다</p>
              <p className="text-sm">첫 지출을 추가해보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{expense.title}</h4>
                      <Badge className={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-x-4">
                      <span>결제자: {expense.paidBy}</span>
                      <span>분할: {expense.splitWith.length}명</span>
                      <span>{expense.date}</span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>
                    )}
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <div className="font-bold">₩{expense.amount.toLocaleString()}</div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingExpense(expense)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
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
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg bg-primary hover:bg-[rgb(35,100,50)] text-white px-4 py-3">
              <Plus className="h-5 w-5 mr-2" />
              지출 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 지출 추가</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="expense-title">제목 *</Label>
                <Input
                  id="expense-title"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                  placeholder="지출 제목을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="expense-amount">금액 *</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>결제자 *</Label>
                <Select value={newExpense.paidBy} onValueChange={(value) => setNewExpense({...newExpense, paidBy: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="결제자를 선택하세요" />
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

              <div>
                <Label>카테고리</Label>
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
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
                <Label htmlFor="expense-description">메모</Label>
                <Textarea
                  id="expense-description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="추가 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div>
                <Label>비용 분할 대상 (선택하지 않으면 모든 멤버)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {members.map((member) => (
                    <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newExpense.splitWith.includes(member.name)}
                        onChange={() => toggleSplitMember(member.name)}
                        className="rounded"
                      />
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
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

      {/* Edit Expense Dialog */}
      {editingExpense && (
        <EditExpenseDialog
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          expense={editingExpense}
          members={members}
          onSave={handleEditExpense}
        />
      )}
    </div>
  );
};

export default PaymentCalculator;
