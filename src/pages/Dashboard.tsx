import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { FileList } from "@/components/dashboard/FileList";
import { StorageStats } from "@/components/dashboard/StorageStats";
import { UploadArea } from "@/components/dashboard/UploadArea";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar user={user} onFolderChange={setCurrentFolderId} />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <StorageStats userId={user.id} />
            <UploadArea userId={user.id} folderId={currentFolderId} />
            <FileList userId={user.id} folderId={currentFolderId} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
