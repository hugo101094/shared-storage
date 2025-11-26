import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText, Image, Video, Music, Archive, File, FolderInput, Folder, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FileListProps {
  userId: string;
  folderId: string | null;
  onFolderChange: (folderId: string | null) => void;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  folder_id: string | null;
  shared_token: string | null;
  folders?: {
    name: string;
  };
}

interface Folder {
  id: string;
  name: string;
}

export const FileList = ({ userId, folderId, onFolderChange }: FileListProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [moveFileId, setMoveFileId] = useState<string | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadFiles();
    loadFolders();
  }, [userId, folderId]);

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("id, name")
      .eq("user_id", userId)
      .order("name");

    if (error) {
      toast.error("Не удалось загрузить папки");
      return;
    }

    setFolders(data || []);
  };

  const loadFiles = async () => {
    setLoading(true);
    let query = supabase
      .from("files")
      .select("*, folders(name, id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (folderId) {
      query = query.eq("folder_id", folderId);
    }
    // Если folderId === null, показываем ВСЕ файлы пользователя (не фильтруем)

    const { data, error } = await query;

    if (error) {
      toast.error("Не удалось загрузить файлы");
      setLoading(false);
      return;
    }

    setFiles(data || []);
    setLoading(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith("video/")) return <Video className="w-5 h-5" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-5 h-5" />;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return <FileText className="w-5 h-5" />;
    if (mimeType.includes("zip") || mimeType.includes("rar"))
      return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = async (file: FileItem) => {
    const { data, error } = await supabase.storage
      .from("user-files")
      .download(file.storage_path);

    if (error) {
      toast.error("Не удалось скачать файл");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteFileId) return;

    const file = files.find((f) => f.id === deleteFileId);
    if (!file) return;

    const { error: storageError } = await supabase.storage
      .from("user-files")
      .remove([file.storage_path]);

    if (storageError) {
      toast.error("Не удалось удалить файл из хранилища");
      return;
    }

    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", deleteFileId);

    if (dbError) {
      toast.error("Не удалось удалить файл");
      return;
    }

    toast.success("Файл удалён");
    setDeleteFileId(null);
    loadFiles();
  };

  const handleMoveFile = async () => {
    if (!moveFileId) return;

    const { error } = await supabase
      .from("files")
      .update({ folder_id: targetFolderId })
      .eq("id", moveFileId);

    if (error) {
      toast.error("Не удалось переместить файл");
      return;
    }

    toast.success("Файл перемещён");
    setMoveFileId(null);
    setTargetFolderId(null);
    loadFiles();
  };

  const handleGenerateShareLink = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    // Если у файла уже есть токен, используем его
    if (file.shared_token) {
      const link = `${window.location.origin}/shared/${file.shared_token}`;
      setShareLink(link);
      setShareFileId(fileId);
      return;
    }

    // Генерируем новый токен
    const token = crypto.randomUUID();
    
    const { error } = await supabase
      .from("files")
      .update({ shared_token: token })
      .eq("id", fileId);

    if (error) {
      toast.error("Не удалось создать ссылку");
      return;
    }

    const link = `${window.location.origin}/shared/${token}`;
    setShareLink(link);
    setShareFileId(fileId);
    loadFiles();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Ссылка скопирована");
  };

  const handleFolderClick = (folderId: string) => {
    onFolderChange(folderId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Файлы</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Файлов пока нет. Загрузите первый файл!
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-muted-foreground">
                      {getFileIcon(file.mime_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                        {file.folders?.name && (
                          <>
                            {" • "}
                            <button
                              onClick={() => handleFolderClick((file.folders as any).id)}
                              className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                            >
                              <Folder className="w-3 h-3" />
                              {file.folders.name}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleGenerateShareLink(file.id)}
                      title="Поделиться файлом"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMoveFileId(file.id)}
                      title="Переместить в папку"
                    >
                      <FolderInput className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteFileId(file.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить файл</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот файл? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!moveFileId} onOpenChange={() => setMoveFileId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переместить файл в папку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={targetFolderId || "root"} onValueChange={(value) => setTargetFolderId(value === "root" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите папку" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Все файлы (корень)</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMoveFileId(null)} className="flex-1">
                Отмена
              </Button>
              <Button onClick={handleMoveFile} className="flex-1">
                Переместить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareFileId} onOpenChange={() => {
        setShareFileId(null);
        setCopied(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Поделиться файлом</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
              />
              <Button onClick={handleCopyLink} size="icon" variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Любой, у кого есть эта ссылка, сможет просмотреть и скачать файл
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
