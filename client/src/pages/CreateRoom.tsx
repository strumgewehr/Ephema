import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const [roomCode, setRoomCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    let currentRoomCode = "";

    socket.onopen = () => {
      // Try to restore previous userId from sessionStorage
      const storedUserId = sessionStorage.getItem('chatUserId');
      socket.send(JSON.stringify({ 
        type: "create_room",
        payload: { userId: storedUserId || undefined }
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === "room_created") {
        currentRoomCode = message.payload.code;
        setRoomCode(currentRoomCode);
        setIsConnecting(false);
        // Store the userId for future reconnections
        if (message.payload.userId) {
          sessionStorage.setItem('chatUserId', message.payload.userId);
        }
      } else if (message.type === "user_joined") {
        setLocation(`/chat/${currentRoomCode}`);
      } else if (message.type === "error") {
        toast({
          variant: "destructive",
          title: "Error",
          description: message.payload.message,
        });
        setIsConnecting(false);
      }
    };

    socket.onerror = () => {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to server. Please try again.",
      });
      setIsConnecting(false);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [toast, setLocation]);

  const handleCopy = async () => {
    if (!roomCode) return;
    
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the code manually",
      });
    }
  };

  const handleCancel = () => {
    if (ws) {
      ws.close();
    }
    setLocation("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl">Room Created</CardTitle>
          <CardDescription>Share this code with your chat partner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isConnecting ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 data-testid="icon-loading" className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Creating room...</p>
            </div>
          ) : (
            <>
              <div className="p-8 rounded-2xl border-2 border-border bg-card/50 text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <p 
                    data-testid="text-room-code"
                    className="text-4xl md:text-5xl font-mono font-bold tracking-widest"
                  >
                    {roomCode}
                  </p>
                  <Button
                    data-testid="button-copy-code"
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-10 w-10"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the icon to copy
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <Badge variant="secondary" className="text-sm">
                  Waiting for partner to join...
                </Badge>
              </div>

              <Button
                data-testid="button-cancel"
                variant="outline"
                onClick={handleCancel}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
