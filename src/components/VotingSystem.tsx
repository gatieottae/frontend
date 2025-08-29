
import { useState } from "react";
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
import { Plus, Vote, Clock, CheckCircle, CalendarIcon, Link, MapPin, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VotingSystemProps {
  groupId: string;
}

interface VoteOption {
  id: string;
  text: string;
  link?: string;
  thumbnail?: string;
  votes: number;
  voters: string[];
}

interface Vote {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  endDate: string;
  options: VoteOption[];
  totalVoters: number;
  myVote?: string;
}

// 임시 투표 데이터
const mockVotes: Vote[] = [
  {
    id: "1",
    title: "숙소 선택",
    description: "제주도 숙소를 투표로 결정해요!",
    category: "숙소",
    status: "active",
    endDate: "2025-03-10",
    options: [
      { id: "1", text: "제주 오션뷰 펜션", votes: 3, voters: ["김민수", "이지은", "박정우"] },
      { id: "2", text: "제주 힐링 리조트", votes: 1, voters: ["최유리"] }
    ],
    totalVoters: 4,
    myVote: "1"
  },
  {
    id: "2",
    title: "첫날 점심 메뉴",
    description: "도착 후 첫 점심 메뉴를 정해봐요",
    category: "음식점",
    status: "ended",
    endDate: "2025-03-05",
    options: [
      { id: "1", text: "흑돼지 구이", votes: 4, voters: ["김민수", "이지은", "박정우", "최유리"] },
      { id: "2", text: "해물찜", votes: 0, voters: [] }
    ],
    totalVoters: 4,
    myVote: "1"
  }
];

const categories = [
  { value: "숙소", label: "숙소" },
  { value: "음식점", label: "음식점" },
  { value: "카페", label: "카페" },
  { value: "활동", label: "활동" },
  { value: "교통", label: "교통" },
  { value: "기타", label: "기타" }
];

const VotingSystem = ({ groupId }: VotingSystemProps) => {
  const [votes, setVotes] = useState<Vote[]>(mockVotes);
  const [isCreatingVote, setIsCreatingVote] = useState(false);
  const [newVote, setNewVote] = useState({
    title: "",
    description: "",
    category: "",
    endDate: undefined as Date | undefined,
    options: [
      { text: "", link: "" },
      { text: "", link: "" }
    ]
  });

  const handleVote = (voteId: string, optionId: string) => {
    setVotes(votes.map(vote => {
      if (vote.id === voteId && vote.status === "active") {
        // 기존 투표 제거
        const updatedOptions = vote.options.map(option => ({
          ...option,
          votes: option.voters.includes("김민수") ? option.votes - 1 : option.votes,
          voters: option.voters.filter(voter => voter !== "김민수")
        }));
        
        // 새 투표 추가
        const finalOptions = updatedOptions.map(option => 
          option.id === optionId 
            ? { ...option, votes: option.votes + 1, voters: [...option.voters, "김민수"] }
            : option
        );

        return { ...vote, options: finalOptions, myVote: optionId };
      }
      return vote;
    }));
  };

  const handleCreateVote = () => {
    if (newVote.title && newVote.category && newVote.endDate && 
        newVote.options.filter(opt => opt.text.trim()).length >= 2) {
      const vote: Vote = {
        id: Date.now().toString(),
        title: newVote.title,
        description: newVote.description,
        category: newVote.category,
        status: "active",
        endDate: format(newVote.endDate, "yyyy-MM-dd"),
        options: newVote.options
          .filter(opt => opt.text.trim())
          .map((opt, index) => ({
            id: (index + 1).toString(),
            text: opt.text.trim(),
            link: opt.link.trim() || undefined,
            votes: 0,
            voters: []
          })),
        totalVoters: 4
      };
      setVotes([vote, ...votes]);
      setNewVote({ 
        title: "", 
        description: "", 
        category: "", 
        endDate: undefined,
        options: [{ text: "", link: "" }, { text: "", link: "" }] 
      });
      setIsCreatingVote(false);
    }
  };

  const addOption = () => {
    setNewVote({ 
      ...newVote, 
      options: [...newVote.options, { text: "", link: "" }] 
    });
  };

  const updateOption = (index: number, field: 'text' | 'link', value: string) => {
    const newOptions = [...newVote.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setNewVote({ ...newVote, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (newVote.options.length > 2) {
      const newOptions = newVote.options.filter((_, i) => i !== index);
      setNewVote({ ...newVote, options: newOptions });
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-500" : "bg-gray-500";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "숙소": return "bg-blue-100 text-blue-800";
      case "음식점": return "bg-orange-100 text-orange-800";
      case "카페": return "bg-yellow-100 text-yellow-800";
      case "활동": return "bg-green-100 text-green-800";
      case "교통": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isVoteExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const canCreateVote = () => {
    return newVote.title.trim() && 
           newVote.category && 
           newVote.endDate && 
           newVote.options.filter(opt => opt.text.trim()).length >= 2;
  };

  const showLocationSearch = () => {
    return ["숙소", "음식점", "카페"].includes(newVote.category);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">투표</h2>
        <Dialog open={isCreatingVote} onOpenChange={setIsCreatingVote}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
                    onChange={(e) => setNewVote({...newVote, title: e.target.value})}
                    placeholder="투표 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vote-description">설명</Label>
                  <Textarea
                    id="vote-description"
                    value={newVote.description}
                    onChange={(e) => setNewVote({...newVote, description: e.target.value})}
                    placeholder="투표에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>카테고리 *</Label>
                  <Select value={newVote.category} onValueChange={(value) => setNewVote({...newVote, category: value})}>
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newVote.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newVote.endDate ? format(newVote.endDate, "yyyy년 MM월 dd일") : "날짜를 선택하세요"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newVote.endDate}
                        onSelect={(date) => setNewVote({...newVote, endDate: date})}
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
                  {showLocationSearch() && (
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      장소 검색
                    </Button>
                  )}
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
                              onClick={() => removeOption(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder="선택지 이름을 입력하세요"
                        />
                        
                        <div className="flex items-center space-x-2">
                          <Link className="h-4 w-4" />
                          <Input
                            value={option.link}
                            onChange={(e) => updateOption(index, 'link', e.target.value)}
                            placeholder="링크 입력 (선택사항)"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Button variant="outline" onClick={addOption} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  선택지 추가
                </Button>
              </div>

              {/* 하단 액션 버튼 */}
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleCreateVote} 
                  className="flex-1"
                  disabled={!canCreateVote()}
                >
                  만들기
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingVote(false)} 
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 투표 목록 */}
      <div className="space-y-4">
        {votes.map((vote) => {
          const expired = isVoteExpired(vote.endDate);
          const currentStatus = expired ? "ended" : vote.status;
          
          return (
            <Card key={vote.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2 mb-2">
                      <Vote className="h-5 w-5" />
                      <span>{vote.title}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getCategoryColor(vote.category)}>
                        {vote.category}
                      </Badge>
                      <Badge className={`${getStatusColor(currentStatus)} text-white`}>
                        {currentStatus === "active" ? "진행 중" : "종료됨"}
                      </Badge>
                    </div>
                    {vote.description && (
                      <p className="text-muted-foreground">{vote.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {vote.endDate}
                    </div>
                    {expired && (
                      <div className="text-xs text-red-500 mt-1">마감됨</div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vote.options.map((option) => {
                    const percentage = vote.totalVoters > 0 ? (option.votes / vote.totalVoters) * 100 : 0;
                    const isMyVote = vote.myVote === option.id;
                    
                    return (
                      <div
                        key={option.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          currentStatus === "active" ? "hover:bg-muted/50" : ""
                        } ${isMyVote ? "border-primary bg-primary/5" : ""}`}
                        onClick={() => currentStatus === "active" && handleVote(vote.id, option.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{option.text}</span>
                            {isMyVote && <CheckCircle className="h-4 w-4 text-primary" />}
                            {option.link && (
                              <Link className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {option.votes}표 ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2 mb-2" />
                        {option.voters.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {option.voters.join(", ")}
                          </div>
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
    </div>
  );
};

export default VotingSystem;
