
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    id: string;
    title: string;
    amount: number;
    paidBy: string;
    category: string;
    description?: string;
    splitWith: string[];
  };
  members: Array<{ id: string; name: string }>;
  onSave: (updatedExpense: any) => void;
}

const categories = [
  { value: "숙박", label: "숙박" },
  { value: "교통", label: "교통" },
  { value: "식비", label: "식비" },
  { value: "활동", label: "활동" },
  { value: "쇼핑", label: "쇼핑" },
  { value: "기타", label: "기타" }
];

const EditExpenseDialog = ({ open, onOpenChange, expense, members, onSave }: EditExpenseDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: expense.title,
    amount: expense.amount.toString(),
    paidBy: expense.paidBy,
    category: expense.category,
    description: expense.description || "",
    splitWith: expense.splitWith
  });

  const handleSave = () => {
    if (!formData.title || !formData.amount || !formData.paidBy) {
      toast({
        title: "필수 항목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const updatedExpense = {
      ...expense,
      title: formData.title,
      amount: parseInt(formData.amount),
      paidBy: formData.paidBy,
      category: formData.category,
      description: formData.description,
      splitWith: formData.splitWith
    };

    onSave(updatedExpense);
    toast({
      title: "지출이 수정되었습니다",
    });
    onOpenChange(false);
  };

  const toggleSplitMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      splitWith: prev.splitWith.includes(memberId)
        ? prev.splitWith.filter(id => id !== memberId)
        : [...prev.splitWith, memberId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>지출 수정</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="지출 제목을 입력하세요"
            />
          </div>

          <div>
            <Label htmlFor="amount">금액 *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div>
            <Label>결제자 *</Label>
            <Select value={formData.paidBy} onValueChange={(value) => setFormData(prev => ({ ...prev, paidBy: value }))}>
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
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
            <Label htmlFor="description">메모</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="추가 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <Label>비용 분할 대상</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {members.map((member) => (
                <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.splitWith.includes(member.name)}
                    onChange={() => toggleSplitMember(member.name)}
                    className="rounded"
                  />
                  <span className="text-sm">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              저장
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
