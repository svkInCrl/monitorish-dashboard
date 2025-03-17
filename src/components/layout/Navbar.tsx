
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between px-4">
        {isSearching ? (
          <div className="flex w-full max-w-xl items-center animate-fade-in">
            <Search className="absolute ml-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-full bg-muted pl-10"
              autoFocus
              onBlur={() => setIsSearching(false)}
            />
          </div>
        ) : (
          <div className="font-medium md:text-lg">
            Threat Erase Dashboard
          </div>
        )}
        <div className="flex items-center gap-4">
          {!isSearching && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsSearching(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://i.pravatar.cc/200" alt="User avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
