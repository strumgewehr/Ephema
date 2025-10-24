import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Lock, Zap, Users } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    setLocation("/create");
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter a room code");
      return;
    }
    
    setLocation(`/chat/${code}`);
  };

  if (showJoinForm) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Join Room</CardTitle>
            <CardDescription>Enter the room code shared with you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div className="space-y-2">
                <Input
                  data-testid="input-room-code"
                  type="text"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  className="text-center text-2xl font-mono tracking-widest uppercase h-16"
                  maxLength={6}
                  autoFocus
                />
                {error && (
                  <p data-testid="text-error" className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="button-back"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowJoinForm(false);
                    setRoomCode("");
                    setError("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  data-testid="button-join-room"
                  type="submit"
                  className="flex-1"
                  disabled={!roomCode.trim()}
                >
                  Join Room
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ephemeral Chat
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No logins. No history. Just chat.
            </p>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Create a room, share the code, and start chatting instantly. Messages disappear when you leave.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button
              data-testid="button-create-room"
              size="lg"
              onClick={handleCreateRoom}
              className="text-lg py-6 w-full sm:w-auto"
            >
              <Users className="mr-2 h-5 w-5" />
              Create Room
            </Button>
            <Button
              data-testid="button-show-join"
              size="lg"
              variant="outline"
              onClick={() => setShowJoinForm(true)}
              className="text-lg py-6 w-full sm:w-auto"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Join Room
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                End-to-end encrypted conversations with unique room codes
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Real-time messaging with instant delivery
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No Registration</h3>
              <p className="text-sm text-muted-foreground">
                Start chatting immediately without creating an account
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
