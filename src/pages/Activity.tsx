import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon, Upload, Download, Trash2, FolderPlus } from "lucide-react";

const Activity = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadActions(session.user.id);
    });
  }, [navigate]);

  const loadActions = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_actions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setActions(data);
    }
    setLoading(false);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "upload":
        return <Upload className="w-5 h-5 text-primary" />;
      case "download":
        return <Download className="w-5 h-5 text-primary" />;
      case "delete":
        return <Trash2 className="w-5 h-5 text-destructive" />;
      case "create_folder":
        return <FolderPlus className="w-5 h-5 text-primary" />;
      default:
        return <ActivityIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar user={user} onFolderChange={(folderId) => navigate("/dashboard")} />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <ActivityIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Журнал действий</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Последняя активность</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : actions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Действий пока нет
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="mt-1">{getActionIcon(action.action_type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium capitalize">
                            {action.action_type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(action.created_at).toLocaleString()}
                          </p>
                          {action.details && Object.keys(action.details).length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {JSON.stringify(action.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Activity;
