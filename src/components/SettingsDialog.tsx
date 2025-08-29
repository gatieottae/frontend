
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Bell, Shield, HelpCircle } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const settingsOptions = [
    {
      icon: User,
      title: "계정 설정",
      description: "프로필 정보 및 계정 관리",
      action: () => console.log("계정 설정")
    },
    {
      icon: Bell,
      title: "알림 설정",
      description: "푸시 알림 및 이메일 설정",
      action: () => console.log("알림 설정")
    },
    {
      icon: Shield,
      title: "개인정보 보호",
      description: "프라이버시 및 보안 설정",
      action: () => console.log("개인정보 보호")
    },
    {
      icon: HelpCircle,
      title: "도움말",
      description: "자주 묻는 질문 및 지원",
      action: () => console.log("도움말")
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
          <DialogDescription>
            앱 설정을 관리할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {settingsOptions.map((option, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={option.action}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <option.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
