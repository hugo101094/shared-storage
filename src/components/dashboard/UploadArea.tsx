import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UploadAreaProps {
  userId: string;
  folderId: string | null;
}

export const UploadArea = ({ userId, folderId }: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const sanitizeFileName = (name: string): string => {
    // Транслитерация кириллицы
    const ru: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    
    return name
      .toLowerCase()
      .split('')
      .map(char => ru[char] || char)
      .join('')
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${userId}/${Date.now()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("user-files")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from("files").insert({
      user_id: userId,
      name: file.name,
      size: file.size,
      mime_type: file.type,
      extension: fileExt,
      storage_path: fileName,
      folder_id: folderId,
    });

    if (dbError) throw dbError;
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setUploading(true);

      const files = Array.from(e.dataTransfer.files);

      try {
        await Promise.all(files.map(uploadFile));
        toast.success(`${files.length} файл(ов) успешно загружено`);
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || "Не удалось загрузить файлы");
      } finally {
        setUploading(false);
      }
    },
    [userId, folderId]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);

    try {
      await Promise.all(files.map(uploadFile));
      toast.success(`${files.length} файл(ов) успешно загружено`);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Не удалось загрузить файлы");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      className={`transition-all ${
        isDragging ? "border-primary border-2 bg-primary/5" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {uploading ? "Загрузка..." : "Перетащите файлы сюда"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            или нажмите, чтобы выбрать файлы
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span className="cursor-pointer">
                {uploading ? "Загрузка..." : "Выбрать файлы"}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};
