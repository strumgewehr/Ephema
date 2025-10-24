import { useEffect, useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Paperclip, 
  ArrowLeft, 
  Loader2, 
  X,
  Download,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  userId: string;
  content: string;
  type: "text" | "image";
  timestamp: number;
  isSelf: boolean;
}

export default function ChatRoom() {
  const [, params] = useRoute("/chat/:code");
  const [, setLocation] = useLocation();
  const roomCode = params?.code || "";
  
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string>("");
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomCode) {
      setLocation("/");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // Try to restore previous userId from sessionStorage
      const storedUserId = sessionStorage.getItem('chatUserId');
      socket.send(JSON.stringify({ 
        type: "join_room", 
        payload: { 
          code: roomCode,
          userId: storedUserId || undefined
        } 
      }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "room_joined") {
          userIdRef.current = message.payload.userId;
          setUserId(message.payload.userId);
          setIsConnected(true);
          setIsConnecting(false);
          setPartnerConnected(message.payload.partnerConnected || false);
          
          // Store the userId for future reconnections
          sessionStorage.setItem('chatUserId', message.payload.userId);
          
          // Load existing messages if any
          if (message.payload.messages && Array.isArray(message.payload.messages)) {
            const historicalMessages = message.payload.messages.map((msg: any) => ({
              ...msg,
              isSelf: msg.userId === message.payload.userId,
            }));
            setMessages(historicalMessages);
          }
        } else if (message.type === "user_joined") {
          setPartnerConnected(true);
          toast({
            title: "Partner joined",
            description: "Your chat partner has connected",
          });
        } else if (message.type === "user_left") {
          setPartnerConnected(false);
          toast({
            title: "Partner left",
            description: "Your chat partner has disconnected",
          });
        } else if (message.type === "new_message") {
          const newMsg: Message = {
            ...message.payload,
            isSelf: message.payload.userId === userIdRef.current,
          };
          setMessages(prev => [...prev, newMsg]);
        } else if (message.type === "error") {
          toast({
            variant: "destructive",
            title: "Error",
            description: message.payload.message,
          });
          if (message.payload.code === "ROOM_NOT_FOUND") {
            setTimeout(() => setLocation("/"), 2000);
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onerror = () => {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to chat room",
      });
      setIsConnecting(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [roomCode, setLocation, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ws || !isConnected) return;
    
    if (selectedImage) {
      await handleSendImage();
    } else if (inputMessage.trim()) {
      setIsSending(true);
      ws.send(JSON.stringify({
        type: "send_message",
        payload: {
          roomCode,
          content: inputMessage,
          type: "text",
        },
      }));
      setInputMessage("");
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 8MB",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file",
      });
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSendImage = async () => {
    if (!selectedImage || !ws || !isConnected) return;

    setIsSending(true);
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      ws.send(JSON.stringify({
        type: "send_message",
        payload: {
          roomCode,
          content: base64,
          type: "image",
        },
      }));
      
      setSelectedImage(null);
      setPreviewUrl("");
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    
    reader.readAsDataURL(selectedImage);
  };

  const handleLeave = () => {
    if (ws) {
      ws.close();
    }
    setLocation("/");
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            data-testid="button-leave-room"
            size="icon"
            variant="ghost"
            onClick={handleLeave}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p data-testid="text-room-code-header" className="font-mono text-lg font-semibold">
              {roomCode}
            </p>
            <Badge 
              data-testid="badge-connection-status"
              variant={partnerConnected ? "default" : "secondary"}
              className="text-xs"
            >
              {partnerConnected ? "Connected" : "Waiting..."}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Start the conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Messages are not stored and will disappear when you leave
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`message-${msg.id}`}
                className={cn(
                  "flex",
                  msg.isSelf ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-md md:max-w-lg space-y-1",
                    msg.isSelf ? "items-end" : "items-start"
                  )}
                >
                  {msg.type === "text" ? (
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl break-words",
                        msg.isSelf
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card text-card-foreground rounded-bl-sm"
                      )}
                    >
                      <p className="text-base">{msg.content}</p>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-xl overflow-hidden cursor-pointer hover-elevate",
                        msg.isSelf ? "rounded-br-sm" : "rounded-bl-sm"
                      )}
                      onClick={() => setExpandedImage(msg.content)}
                    >
                      <img
                        src={msg.content}
                        alt="Shared image"
                        className="max-h-96 object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground px-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card/30 backdrop-blur-sm p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
            <Card className="mb-3 p-3">
              <div className="flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedImage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  data-testid="button-remove-image"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <Input
              data-testid="input-message"
              type="text"
              placeholder={partnerConnected ? "Type a message..." : "Waiting for partner..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={!isConnected || !partnerConnected || isSending || !!selectedImage}
              className="flex-1 resize-none rounded-xl"
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              data-testid="button-attach-image"
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || !partnerConnected || isSending || !!selectedImage}
              className="h-10 w-10"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Button
              data-testid="button-send-message"
              type="submit"
              size="icon"
              disabled={!isConnected || !partnerConnected || isSending || (!inputMessage.trim() && !selectedImage)}
              className="h-10 w-10"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage("")}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                data-testid="button-download-image"
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement("a");
                  link.href = expandedImage;
                  link.download = `image-${Date.now()}.png`;
                  link.click();
                }}
                className="h-10 w-10"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                data-testid="button-close-image"
                size="icon"
                variant="secondary"
                onClick={() => setExpandedImage("")}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
