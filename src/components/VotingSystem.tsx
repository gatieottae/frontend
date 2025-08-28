
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Vote, Clock, CheckCircle } from "lucide-react";

interface VotingSystemProps {
  groupId: string;
}

// 임시 투표 데이터
const mockVotes = [
  {
    id: "1",
    title: "숙소 선택",
    description: "제주도 숙소를 투표로 결정해요!",
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

const VotingSystem = ({ groupId }: VotingSystemProps) => {
  const [votes, setVotes] = useState(mockVotes);
  const [isCreatingVote, setIsCreatingVote] = useState(false);
  const [newVote, setNewVote] = useState({
    title: "",
    description: "",
    options: ["", ""]
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
    if (newVote.title && newVote.options.every(opt => opt.trim())) {
      const vote = {
        id: Date.now().toString(),
        title: newVote.title,
        description: newVote.description,
        status: "active" as const,
        endDate: "2025-03-20",
        options: newVote.options.map((text, index) => ({
          id: (index + 1).toString(),
          text: text.trim(),
          votes: 0,
          voters: []
        })),
        totalVoters: 4,
        myVote: null
      };
      setVotes([vote, ...votes]);
      setNewVote({ title: "", description: "", options: ["", ""] });
      setIsCreatingVote(false);
    }
  };

  const addOption = () => {
    setNewVote({ ...newVote, options: [...newVote.options, ""] });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newVote.options];
    newOptions[index] = value;
    setNewVote({ ...newVote, options: newOptions });
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-500" : "bg-gray-500";
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 투표 만들기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vote-title">투표 제목</Label>
                <Input
                  id="vote-title"
                  value={newVote.title}
                  onChange={(e) => setNewVote({...newVote, title: e.target.value})}
                  placeholder="투표 제목을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="vote-description">설명 (선택사항)</Label>
                <Input
                  id="vote-description"
                  value={newVote.description}
                  onChange={(e) => setNewVote({...newVote, description: e.target.value})}
                  placeholder="투표에 대한 설명을 입력하세요"
                />
              </div>
              <div>
                <Label>선택지</Label>
                {newVote.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`선택지 ${index + 1}`}
                    className="mt-2"
                  />
                ))}
                <Button variant="outline" onClick={addOption} className="mt-2 w-full">
                  선택지 추가
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateVote} className="flex-1">
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

      {/* 투표 목록 */}
      <div className="space-y-4">
        {votes.map((vote) => (
          <Card key={vote.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Vote className="h-5 w-5" />
                    <span>{vote.title}</span>
                  </CardTitle>
                  {vote.description && (
                    <p className="text-muted-foreground mt-1">{vote.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(vote.status)} text-white mb-2`}>
                    {vote.status === "active" ? "진행 중" : "종료됨"}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {vote.endDate}
                  </div>
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
                        vote.status === "active" ? "hover:bg-muted/50" : ""
                      } ${isMyVote ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => vote.status === "active" && handleVote(vote.id, option.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium flex items-center">
                          {option.text}
                          {isMyVote && <CheckCircle className="h-4 w-4 ml-2 text-primary" />}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {option.votes}표 ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      {option.voters.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.voters.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VotingSystem;
