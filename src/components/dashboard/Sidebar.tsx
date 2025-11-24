import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cloud, Home, BarChart3, Activity, LogOut, Folder, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@supabase/supabase-js";

interface SidebarProps {
  user: User;
  onFolderChange: (folderId: string | null) => void;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export const Sidebar = ({ user, onFolderChange }: SidebarProps) => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, [user.id]);

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      toast.error("Не удалось загрузить папки");
      return;
    }

    setFolders(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const { error } = await supabase.from("folders").insert({
      name: newFolderName,
      user_id: user.id,
      parent_id: null,
    });

    if (error) {
      toast.error("Не удалось создать папку");
      return;
    }

    toast.success("Папка создана");
    setNewFolderName("");
    setIsDialogOpen(false);
    loadFolders();
  };

  const handleFolderClick = (folderId: string | null) => {
    setSelectedFolder(folderId);
    onFolderChange(folderId);
    if (folderId === null) {
      navigate("/dashboard");
    }
  };

  return (
    <aside className="w-64 border-r bg-card h-screen sticky top-0">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Cloud className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Shared Storage</h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
        <div className="p-4 space-y-2">
          <Button
            variant={selectedFolder === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleFolderClick(null)}
          >
            <Home className="mr-2 h-4 w-4" />
            Все файлы
          </Button>

          <div className="pt-4 pb-2 px-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Папки</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую папку</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder-name">Название папки</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Введите название папки"
                      onKeyDown={(e) => e.key === "Enter" && createFolder()}
                    />
                  </div>
                  <Button onClick={createFolder} className="w-full">
                    Создать папку
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleFolderClick(folder.id)}
            >
              <Folder className="mr-2 h-4 w-4" />
              {folder.name}
            </Button>
          ))}

          <div className="pt-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/statistics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Статистика
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/activity")}
            >
              <Activity className="mr-2 h-4 w-4" />
              Журнал действий
            </Button>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>
    </aside>
  );
};
