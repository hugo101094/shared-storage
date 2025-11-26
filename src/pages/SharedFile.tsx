import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, Video, Music, Archive, File } from "lucide-react";
import { toast } from "sonner";

interface FileData {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}

const SharedFile = () => {
  const { token } = useParams<{ token: string }>();
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadFile();
  }, [token]);

  const loadFile = async () => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("shared_token", token)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setFile(data);
    setLoading(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="w-12 h-12" />;
    if (mimeType.startsWith("video/")) return <Video className="w-12 h-12" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-12 h-12" />;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return <FileText className="w-12 h-12" />;
    if (mimeType.includes("zip") || mimeType.includes("rar"))
      return <Archive className="w-12 h-12" />;
    return <File className="w-12 h-12" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = async () => {
    if (!file) return;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <File className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Файл не найден</h2>
            <p className="text-muted-foreground">
              Файл с этой ссылкой не существует или был удалён
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="text-primary">{file && getFileIcon(file.mime_type)}</div>
            <span className="truncate">{file?.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Размер:</span>
              <span className="font-medium">{file && formatBytes(file.size)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Тип:</span>
              <span className="font-medium">{file?.mime_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Загружен:</span>
              <span className="font-medium">
                {file && new Date(file.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <Button onClick={handleDownload} className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Скачать файл
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedFile;
