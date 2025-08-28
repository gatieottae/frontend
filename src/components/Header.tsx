
import { Button } from "@/components/ui/button";
import { Bell, User, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <h1 className="text-2xl font-bold gradient-text cursor-pointer">같이어때</h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></span>
            </Button>
          </Link>
          
          <Button variant="outline" className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            그룹 만들기
          </Button>
          
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
