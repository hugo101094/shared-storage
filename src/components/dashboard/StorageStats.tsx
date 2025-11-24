import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";

interface StorageStatsProps {
  userId: string;
}

export const StorageStats = ({ userId }: StorageStatsProps) => {
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(5368709120); // 5GB default

  useEffect(() => {
    loadStorageInfo();
  }, [userId]);

  const loadStorageInfo = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("storage_used, storage_limit")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setStorageUsed(data.storage_used || 0);
      setStorageLimit(data.storage_limit || 5368709120);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const usagePercent = (storageUsed / storageLimit) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Использование хранилища</span>
              <span className="text-sm text-muted-foreground">
                {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
